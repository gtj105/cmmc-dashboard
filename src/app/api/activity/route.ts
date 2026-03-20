import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const entries = await sql`
    SELECT h.*, d.abbreviation AS domain_abbr
    FROM practice_history h
    LEFT JOIN practices p ON p.practice_id = h.practice_id
    LEFT JOIN domains d ON d.id = p.domain_id
    ORDER BY h.changed_at DESC
    LIMIT 200
  `
  return NextResponse.json(entries)
}
