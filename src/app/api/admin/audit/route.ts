import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions, requireRole } from '@/lib/auth'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/audit
 * Returns the most recent security events. Admin-only.
 *
 * Query params:
 *   limit  — max results (default 100, max 500)
 *   action — filter by action type (e.g. 'login.failed')
 *   actor  — filter by actor email
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(getAuthOptions())
  const authError = requireRole(session, 'admin')
  if (authError) return authError

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100') || 100, 500)
  const action = url.searchParams.get('action')
  const actor = url.searchParams.get('actor')

  let events
  if (action && actor) {
    events = await sql`
      SELECT * FROM security_events
      WHERE action = ${action} AND actor = ${actor}
      ORDER BY created_at DESC LIMIT ${limit}
    `
  } else if (action) {
    events = await sql`
      SELECT * FROM security_events
      WHERE action = ${action}
      ORDER BY created_at DESC LIMIT ${limit}
    `
  } else if (actor) {
    events = await sql`
      SELECT * FROM security_events
      WHERE actor = ${actor}
      ORDER BY created_at DESC LIMIT ${limit}
    `
  } else {
    events = await sql`
      SELECT * FROM security_events
      ORDER BY created_at DESC LIMIT ${limit}
    `
  }

  return NextResponse.json({ events, count: events.length })
}
