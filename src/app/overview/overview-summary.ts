import type { Domain, EffectivePractice, Practice, RiskLevel } from '@/lib/types'
import {
  computeBaselineTotals,
  computeCoverageTotals,
  computePerDomainCoverageCompletion,
  computePerDomainResidualCompletion,
  computeResidualBlockerCount,
  computeResidualTotals,
  effectivePracticeStatus,
} from '@/lib/overlay-scoring'

export interface OverviewDomainSummary {
  id: number
  name: string
  abbreviation: string
  total: number
  osc_complete: number
  csp_inherited: number
  in_progress: number
  not_started: number
  completion_pct: number
  open_count: number
  ready_count: number
  customer_owned_remaining: number
}

export interface CriticalPracticeSummary {
  practice_id: string
  title: string
  risk_level: RiskLevel
  domain_abbr: string
  domain_id: number
}

export function computeSprsScore(practices: Array<Pick<Practice, 'status' | 'sprs_weight'>>): number {
  return 110 - practices.reduce((total, practice) => {
    if (practice.status === 'Implemented' || practice.status === 'Audit Ready') return total
    return total + (practice.sprs_weight ?? 1)
  }, 0)
}

export function buildOverviewDomainSummaries(
  domains: Array<Pick<Domain, 'id' | 'name' | 'abbreviation'>>,
  effectivePractices: EffectivePractice[],
): OverviewDomainSummary[] {
  const coverageByDomain = new Map(
    computePerDomainCoverageCompletion(effectivePractices).map((domain) => [domain.domain_id, domain] as const),
  )
  const residualByDomain = new Map(
    computePerDomainResidualCompletion(effectivePractices).map((domain) => [domain.domain_id, domain] as const),
  )

  return domains
    .map((domain) => {
      const coverage = coverageByDomain.get(domain.id)
      const residual = residualByDomain.get(domain.id)
      const total = coverage?.total ?? 0
      const coveredCount = coverage?.total_covered ?? 0

      return {
        ...domain,
        total,
        osc_complete: coverage?.osc_complete ?? 0,
        csp_inherited: coverage?.csp_inherited ?? 0,
        in_progress: coverage?.in_progress ?? 0,
        not_started: coverage?.not_started ?? 0,
        completion_pct: coverage?.completion_pct ?? 0,
        open_count: total - coveredCount,
        ready_count: coveredCount,
        customer_owned_remaining:
          coverage?.customer_owned_remaining
          ?? (residual
            ? residual.total - residual.implemented - residual.audit_ready
            : 0),
      }
    })
    .sort((a, b) => a.completion_pct - b.completion_pct)
}

export function buildCriticalPracticeSummaries(
  effectivePractices: EffectivePractice[],
  domains: Array<Pick<Domain, 'id' | 'abbreviation'>>,
): CriticalPracticeSummary[] {
  const domainLookup = new Map(domains.map((domain) => [domain.id, domain] as const))

  return effectivePractices
    .filter((practice) => practice.effective_blocker && effectivePracticeStatus(practice) === 'Not Started')
    .sort((a, b) => {
      const riskOrder: Record<RiskLevel, number> = {
        Critical: 0,
        High: 1,
        Medium: 2,
        Low: 3,
      }
      const riskDelta = riskOrder[a.risk_level] - riskOrder[b.risk_level]
      if (riskDelta !== 0) return riskDelta
      return a.practice_id.localeCompare(b.practice_id)
    })
    .slice(0, 3)
    .map((practice) => ({
      practice_id: practice.practice_id,
      title: practice.title,
      risk_level: practice.risk_level,
      domain_abbr: domainLookup.get(practice.domain_id)?.abbreviation ?? 'CMMC',
      domain_id: practice.domain_id,
    }))
}

export function buildOverviewMetrics(
  baselinePractices: Practice[],
  effectivePractices: EffectivePractice[],
) {
  const baselineTotals = computeBaselineTotals(baselinePractices)
  const coverageTotals = computeCoverageTotals(effectivePractices)
  const residualTotals = computeResidualTotals(effectivePractices)

  return {
    baselineTotals,
    coverageTotals,
    residualTotals,
    residualBlockers: computeResidualBlockerCount(effectivePractices),
    sprsScore: computeSprsScore(effectivePractices.filter((practice) => practice.is_customer_scored)),
    baselineSprsScore: computeSprsScore(baselinePractices),
  }
}
