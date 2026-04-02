import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import { requireRole } from '@/lib/auth'
import { checkCsrf } from '@/lib/api-csrf'
import sql from '@/lib/db'
import { parsePoamPatch, validationError } from '@/lib/validation'

export const dynamic = 'force-dynamic'

const TRACKED_FIELDS = [
  'gap_statement', 'root_cause', 'remediation_plan', 'closure_evidence',
  'responsible_individual', 'resources_required', 'scheduled_completion',
  'milestone_progress', 'status',
] as const

const ALLOWED_UPDATE_KEYS = [
  'gap_statement', 'root_cause', 'remediation_plan', 'closure_evidence',
  'practice_id', 'responsible_individual', 'resources_required',
  'scheduled_completion', 'milestone_progress', 'status',
]

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrfError = checkCsrf(req)
  if (csrfError) return csrfError

  const session = await getAuthSession()
  const authError = requireRole(session, 'editor')
  if (authError) return authError

  const id = parseInt(params.id, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = parsePoamPatch(rawBody)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const body = rawBody as Record<string, unknown>
  const updates: Record<string, unknown> = {}
  for (const key of ALLOWED_UPDATE_KEYS) {
    if (key in body) updates[key] = data[key as keyof typeof data]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // Fetch current row to diff for history
  const [before] = await sql`SELECT * FROM poam_items WHERE id = ${id} AND deleted_at IS NULL`
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let updated: Record<string, unknown> | undefined
  try {
    const [result] = await sql`
      UPDATE poam_items
      SET ${sql(updates)}, updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING *
    `
    updated = result
  } catch (err: unknown) {
    const pgErr = err as { code?: string }
    if (pgErr?.code === '23503') {
      return NextResponse.json({ error: 'Invalid practice_id — practice not found' }, { status: 400 })
    }
    throw err
  }
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Write one history row per changed tracked field
  const changedBy = session!.user.email ?? session!.user.name ?? 'unknown'
  const historyRows = TRACKED_FIELDS
    .filter(field => field in updates)
    .filter(field => String(before[field] ?? '') !== String(updates[field] ?? ''))
    .map(field => ({
      poam_id: id,
      field_changed: field,
      old_value: before[field] != null ? String(before[field]) : null,
      new_value: updates[field] != null ? String(updates[field]) : null,
      changed_by: changedBy,
    }))

  if (historyRows.length > 0) {
    await sql`INSERT INTO poam_history ${sql(historyRows)}`
  }

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrfError = checkCsrf(_req)
  if (csrfError) return csrfError

  const session = await getAuthSession()
  const authError = requireRole(session, 'admin')
  if (authError) return authError

  const id = parseInt(params.id, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const [archived] = await sql`
    UPDATE poam_items
    SET deleted_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING *
  `
  if (!archived) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(archived)
}
