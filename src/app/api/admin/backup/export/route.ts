import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { getAuthOptions, requireRole } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET() {
  const session = await getServerSession(getAuthOptions())
  const authError = requireRole(session, 'admin')
  if (authError) return authError

  const [users, domains, practices, poamItems, practiceHistory] = await Promise.all([
    sql`SELECT * FROM users ORDER BY id`,
    sql`SELECT * FROM domains ORDER BY id`,
    sql`SELECT * FROM practices ORDER BY id`,
    sql`SELECT * FROM poam_items ORDER BY id`,
    sql`SELECT * FROM practice_history ORDER BY id`,
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    exported_by: (session!.user as { email?: string }).email ?? 'unknown',
    users,
    domains,
    practices,
    poam_items: poamItems,
    practice_history: practiceHistory,
  }

  const date = new Date().toISOString().slice(0, 10)
  const filename = `cmmc-backup-${date}.json`

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
