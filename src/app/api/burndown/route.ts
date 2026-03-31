import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

const RANGE_CONFIG = {
  '1d': { interval: '1 day',    step: '4 hours', trunc: 'hour',  format: 'HH24:MI' },
  '1w': { interval: '7 days',   step: '1 day',   trunc: 'day',   format: 'Mon DD'   },
  '1m': { interval: '30 days',  step: '1 day',   trunc: 'day',   format: 'Mon DD'   },
  '3m': { interval: '90 days',  step: '1 week',  trunc: 'week',  format: 'Mon DD'   },
  '6m': { interval: '180 days', step: '2 weeks', trunc: 'week',  format: 'Mon DD'   },
  '1y': { interval: '365 days', step: '1 month', trunc: 'month', format: 'Mon YYYY' },
} as const

type Range = keyof typeof RANGE_CONFIG

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const raw = req.nextUrl.searchParams.get('range') ?? '3m'
  if (!(raw in RANGE_CONFIG)) {
    return NextResponse.json({ error: 'Invalid range' }, { status: 400 })
  }
  const { interval, step, trunc, format } = RANGE_CONFIG[raw as Range]

  // All values sourced from hardcoded RANGE_CONFIG — not user-controlled
  const rows = await sql.unsafe(`
    WITH periods AS (
      SELECT generate_series(
        date_trunc('${trunc}', NOW() - INTERVAL '${interval}'),
        date_trunc('${trunc}', NOW()),
        INTERVAL '${step}'
      ) AS period_start
    )
    SELECT
      to_char(p.period_start, '${format}') AS week,
      COUNT(pr.id) FILTER (
        WHERE pr.status IN ('Implemented', 'Audit Ready')
          AND date_trunc('${trunc}', pr.updated_at) <= p.period_start
      )::int AS closed,
      (SELECT COUNT(*) FROM practices WHERE framework = 'CMMC')::int -
        COUNT(pr.id) FILTER (
          WHERE pr.status IN ('Implemented', 'Audit Ready')
            AND date_trunc('${trunc}', pr.updated_at) <= p.period_start
        )::int AS open
    FROM periods p
    LEFT JOIN practices pr ON pr.framework = 'CMMC'
    GROUP BY p.period_start
    ORDER BY p.period_start
  `)

  return NextResponse.json(rows)
}
