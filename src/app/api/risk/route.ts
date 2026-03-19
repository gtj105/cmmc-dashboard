import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const practices = await sql`
    SELECT
      p.id, p.practice_id, p.framework, p.title, p.status,
      p.risk_level, p.owner, p.due_date,
      d.name AS domain_name, d.abbreviation
    FROM practices p
    JOIN domains d ON d.id = p.domain_id
    WHERE p.risk_level IN ('High', 'Critical')
    ORDER BY
      CASE p.risk_level WHEN 'Critical' THEN 0 WHEN 'High' THEN 1 END,
      p.due_date ASC NULLS LAST
  `

  return NextResponse.json(practices)
}
