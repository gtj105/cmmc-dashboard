import sql from '@/lib/db'
import { fetchEffectivePractices } from '@/lib/overlays'
import { computeSprsScore, buildOverviewDomainSummaries } from '@/app/overview/overview-summary'
import type { PoamItem, ActivityEntry, Domain } from '@/lib/types'

export type ActivityEntryWithDomain = ActivityEntry & { domain_abbr: string | null }

export interface ReportData {
  sprsScore: number
  totalPractices: number
  implementedCount: number
  lastAssessmentDate: string | null
  evidenceGap: number
  domainsWithPct: ReturnType<typeof buildOverviewDomainSummaries>
  openPoamItems: PoamItem[]
  recentActivity: ActivityEntryWithDomain[]
  reportDate: string
}

export async function fetchReportData(): Promise<ReportData> {
  const [
    { effectivePractices },
    [stats],
    domains,
    openPoamItems,
    recentActivity,
  ] = await Promise.all([
    fetchEffectivePractices(sql, { framework: 'CMMC' }),
    sql<Array<{
      total_practices: number
      implemented_count: number
      last_assessment_date: string | null
    }>>`
      SELECT
        COUNT(*) FILTER (WHERE framework = 'CMMC')::int              AS total_practices,
        COUNT(*) FILTER (
          WHERE framework = 'CMMC'
            AND status IN ('Implemented', 'Audit Ready')
        )::int                                                        AS implemented_count,
        MAX(updated_at)                                               AS last_assessment_date
      FROM practices
    `,
    sql<Array<Pick<Domain, 'id' | 'name' | 'abbreviation'>>>`
      SELECT id, name, abbreviation
      FROM domains
      WHERE framework = 'CMMC'
      ORDER BY abbreviation
    `,
    sql<PoamItem[]>`
      SELECT id, gap_statement, root_cause, remediation_plan, closure_evidence,
             practice_id, responsible_individual, resources_required,
             scheduled_completion, milestone_progress, status, deleted_at, created_at, updated_at
      FROM poam_items
      WHERE status != 'Closed' AND deleted_at IS NULL
      ORDER BY
        CASE status WHEN 'Open' THEN 1 WHEN 'In Progress' THEN 2 ELSE 3 END,
        scheduled_completion ASC NULLS LAST
    `,
    sql<ActivityEntryWithDomain[]>`
      SELECT h.id, h.practice_id, h.field_changed, h.old_value, h.new_value,
             h.changed_by, h.changed_at, d.abbreviation AS domain_abbr
      FROM practice_history h
      LEFT JOIN practices p ON p.practice_id = h.practice_id
      LEFT JOIN domains d   ON d.id = p.domain_id
      ORDER BY h.changed_at DESC
      LIMIT 20
    `,
  ])

  const customerScored = effectivePractices.filter((p) => p.is_customer_scored)
  const sprsScore = computeSprsScore(customerScored)
  const domainsWithPct = buildOverviewDomainSummaries(domains, effectivePractices)
    .sort((a, b) => a.completion_pct - b.completion_pct) // weakest first
  const evidenceGap = customerScored.filter(
    (p) =>
      (p.status === 'Implemented' || p.status === 'Audit Ready') &&
      !p.evidence_exists,
  ).length

  return {
    sprsScore,
    totalPractices: stats.total_practices,
    implementedCount: stats.implemented_count,
    lastAssessmentDate: stats.last_assessment_date,
    evidenceGap,
    domainsWithPct,
    openPoamItems,
    recentActivity,
    reportDate: new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
  }
}
