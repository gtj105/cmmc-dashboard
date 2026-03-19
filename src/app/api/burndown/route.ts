import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await sql`
    WITH weeks AS (
      SELECT generate_series(
        date_trunc('week', NOW() - INTERVAL '90 days'),
        date_trunc('week', NOW()),
        INTERVAL '1 week'
      ) AS week_start
    )
    SELECT
      to_char(w.week_start, 'Mon DD') AS week,
      COUNT(p.id) FILTER (
        WHERE p.status IN ('Implemented', 'Audit Ready')
          AND date_trunc('week', p.updated_at) <= w.week_start
      )::int AS closed,
      (SELECT COUNT(*) FROM practices WHERE framework = 'CMMC')::int -
        COUNT(p.id) FILTER (
          WHERE p.status IN ('Implemented', 'Audit Ready')
            AND date_trunc('week', p.updated_at) <= w.week_start
        )::int AS open
    FROM weeks w
    LEFT JOIN practices p ON p.framework = 'CMMC'
    GROUP BY w.week_start
    ORDER BY w.week_start
  `

  return NextResponse.json(rows)
}
