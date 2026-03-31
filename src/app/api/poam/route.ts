import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import { requireRole } from '@/lib/auth'
import { checkCsrf } from '@/lib/api-csrf'
import sql from '@/lib/db'
import { parsePoamCreate, validationError } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  const authError = requireRole(session, 'viewer')
  if (authError) return authError

  const includeArchived = req.nextUrl.searchParams.get('include_archived') === 'true'
  const isAdmin = session?.user.role === 'admin'

  if (includeArchived && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const items = includeArchived
    ? await sql`SELECT * FROM poam_items ORDER BY deleted_at DESC NULLS LAST, created_at DESC`
    : await sql`SELECT * FROM poam_items WHERE deleted_at IS NULL ORDER BY created_at DESC`

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const csrfError = checkCsrf(req)
  if (csrfError) return csrfError

  const session = await getAuthSession()
  const authError = requireRole(session, 'editor')
  if (authError) return authError

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = parsePoamCreate(rawBody)
  if (!parsed.success) return validationError(parsed.error)
  const {
    gap_statement,
    root_cause,
    remediation_plan,
    closure_evidence,
    practice_id,
    responsible_individual,
    resources_required,
    scheduled_completion,
    milestone_progress,
    status,
  } = parsed.data

  try {
    const [created] = await sql`
      INSERT INTO poam_items (
        gap_statement, root_cause, remediation_plan, closure_evidence,
        practice_id, responsible_individual, resources_required,
        scheduled_completion, milestone_progress, status
      )
      VALUES (
        ${gap_statement.trim()},
        ${root_cause ?? null},
        ${remediation_plan ?? null},
        ${closure_evidence ?? null},
        ${practice_id ?? null},
        ${responsible_individual ?? null},
        ${resources_required ?? null},
        ${scheduled_completion ?? null},
        ${milestone_progress ?? 0},
        ${status ?? 'Open'}
      )
      RETURNING *
    `
    return NextResponse.json(created, { status: 201 })
  } catch (err: unknown) {
    const pgErr = err as { code?: string }
    if (pgErr?.code === '23503') {
      return NextResponse.json({ error: 'Invalid practice_id — practice not found' }, { status: 400 })
    }
    throw err
  }
}
