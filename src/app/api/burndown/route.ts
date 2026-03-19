import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await sql`
    SELECT
      to_char(date_trunc('week', updated_at), 'Mon DD') AS week,
      COUNT(*) FILTER (WHERE status IN ('Not Started', 'In Progress'))::int AS open,
      COUNT(*) FILTER (WHERE status IN ('Implemented', 'Audit Ready'))::int AS closed
    FROM practices
    WHERE framework = 'CMMC'
      AND updated_at >= NOW() - INTERVAL '90 days'
    GROUP BY date_trunc('week', updated_at)
    ORDER BY date_trunc('week', updated_at)
  `

  return NextResponse.json(rows)
}
