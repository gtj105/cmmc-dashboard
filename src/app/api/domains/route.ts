import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const domains = await sql`
    SELECT
      d.id, d.name, d.abbreviation, d.framework, d.description,
      COUNT(p.id)::int AS total,
      COUNT(p.id) FILTER (WHERE p.status = 'Implemented')::int AS implemented,
      COUNT(p.id) FILTER (WHERE p.status = 'Audit Ready')::int AS audit_ready,
      COUNT(p.id) FILTER (WHERE p.status = 'In Progress')::int AS in_progress,
      COUNT(p.id) FILTER (WHERE p.status = 'Not Started')::int AS not_started
    FROM domains d
    LEFT JOIN practices p ON p.domain_id = d.id
    WHERE d.framework = 'CMMC'
    GROUP BY d.id
    ORDER BY d.abbreviation
  `

  const result = domains.map((d: any) => ({
    ...d,
    completion_pct: d.total > 0
      ? Math.round(((d.implemented + d.audit_ready) / d.total) * 100)
      : 0
  }))

  return NextResponse.json(result)
}
