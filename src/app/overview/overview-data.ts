import sql from '@/lib/db'
import { fetchEffectivePractices } from '@/lib/overlays'
import type { Domain } from '@/lib/types'
import {
  buildCriticalPracticeSummaries,
  buildOverviewDomainSummaries,
  buildOverviewMetrics,
} from './overview-summary'
import { effectivePracticeStatus } from '@/lib/overlays/scoring'

export async function fetchOverviewData() {
  const [
    { baselinePractices, effectivePractices, activePacks },
    [stats],
    domains,
  ] = await Promise.all([
    fetchEffectivePractices(sql, { framework: 'CMMC' }),
    sql`
      SELECT
        COUNT(*) FILTER (WHERE framework = 'ITAR')::int AS itar_total,
        COUNT(*) FILTER (WHERE framework = 'ITAR' AND status IN ('Implemented', 'Audit Ready'))::int AS itar_implemented,
        MAX(updated_at) AS last_assessment_date
      FROM practices
    `,
    sql`
      SELECT d.id, d.name, d.abbreviation
      FROM domains d
      WHERE d.framework = 'CMMC'
      ORDER BY d.abbreviation
    ` as Promise<Array<Pick<Domain, 'id' | 'name' | 'abbreviation'>>>,
  ])

  const burndown = await sql`
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

  const hasActiveOverlay = activePacks.length > 0
  const metrics = buildOverviewMetrics(baselinePractices, effectivePractices)
  const domainsWithPct = buildOverviewDomainSummaries(domains, effectivePractices)
  const criticalPractices = buildCriticalPracticeSummaries(effectivePractices, domains)
  const evidenceGap = effectivePractices.filter((practice) =>
    practice.is_customer_scored &&
    (practice.status === 'Implemented' || practice.status === 'Audit Ready') &&
    !practice.evidence_exists,
  ).length
  const weakestDomain = domainsWithPct[0]

  const statusBreakdown = {
    not_started: effectivePractices.filter((p) => effectivePracticeStatus(p) === 'Not Started').length,
    in_progress:  effectivePractices.filter((p) => effectivePracticeStatus(p) === 'In Progress').length,
    implemented:  effectivePractices.filter((p) => effectivePracticeStatus(p) === 'Implemented').length,
    audit_ready:  effectivePractices.filter((p) => effectivePracticeStatus(p) === 'Audit Ready').length,
  }

  const ownershipBreakdown = hasActiveOverlay ? {
    csp:    effectivePractices.filter((p) => p.is_fully_inherited).length,
    shared: effectivePractices.filter((p) => !p.is_fully_inherited && (p.is_shared_responsibility || p.requires_validation)).length,
    osc:    effectivePractices.filter((p) => !p.is_fully_inherited && !p.is_shared_responsibility && !p.requires_validation).length,
  } : null

  return {
    burndown,
    criticalPractices,
    domainsWithPct,
    effectivePractices,
    evidenceGap,
    hasActiveOverlay,
    metrics,
    ownershipBreakdown,
    stats,
    statusBreakdown,
    weakestDomain,
  }
}

export function formatAssessmentDate(value: string | null): string {
  if (!value) return 'No data'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function computeItarScorePct(itarTotal: number, itarImplemented: number): number {
  if (itarTotal <= 0) return 0
  return Math.round((itarImplemented / itarTotal) * 100)
}

export { ragTextClass, ragBorderClass, ragPanelClass, riskColorMap } from '@/lib/ui-utils'
