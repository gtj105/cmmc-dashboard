import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [stats] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE framework = 'CMMC')::int AS total,
      COUNT(*) FILTER (WHERE framework = 'CMMC' AND status = 'Not Started')::int AS not_started,
      COUNT(*) FILTER (WHERE framework = 'CMMC' AND status = 'In Progress')::int AS in_progress,
      COUNT(*) FILTER (WHERE framework = 'CMMC' AND status = 'Implemented')::int AS implemented,
      COUNT(*) FILTER (WHERE framework = 'CMMC' AND status = 'Audit Ready')::int AS audit_ready,
      COUNT(*) FILTER (WHERE framework = 'ITAR')::int AS itar_total,
      COUNT(*) FILTER (WHERE framework = 'ITAR' AND status IN ('Implemented', 'Audit Ready'))::int AS itar_implemented,
      MAX(updated_at) AS last_assessment_date
    FROM practices
  `

  const score_pct = stats.total > 0
    ? Math.round(((stats.implemented + stats.audit_ready) / stats.total) * 100)
    : 0
  const itar_score_pct = stats.itar_total > 0
    ? Math.round((stats.itar_implemented / stats.itar_total) * 100)
    : 0

  return NextResponse.json({ ...stats, score_pct, itar_score_pct })
}
