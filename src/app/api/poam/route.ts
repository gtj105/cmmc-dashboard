import { NextRequest, NextResponse } from 'next/server'
// GET removed — POAM page is now server-rendered; initial data fetched directly via sql
import { getServerSession } from 'next-auth'
import { getAuthOptions, requireRole } from '@/lib/auth'
import { checkCsrf } from '@/lib/api-csrf'
import sql from '@/lib/db'
import type { PoamStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

const VALID_STATUSES: PoamStatus[] = ['Open', 'In Progress', 'Closed']

export async function POST(req: NextRequest) {
  const csrfError = checkCsrf(req)
  if (csrfError) return csrfError

  const session = await getServerSession(getAuthOptions())
  const authError = requireRole(session, 'editor')
  if (authError) return authError

  const body = await req.json()
  const { finding, practice_id, responsible_individual, resources_required, scheduled_completion, milestone_progress, status } = body

  if (!finding || typeof finding !== 'string' || finding.trim() === '') {
    return NextResponse.json({ error: 'finding is required' }, { status: 400 })
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  try {
    const [created] = await sql`
      INSERT INTO poam_items (finding, practice_id, responsible_individual, resources_required, scheduled_completion, milestone_progress, status)
      VALUES (
        ${finding.trim()},
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
