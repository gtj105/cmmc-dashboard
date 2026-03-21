import type { EffectivePractice, Framework, RiskLevel, Status } from '@/lib/types'
import { effectivePracticeStatus } from '@/lib/overlay-scoring'

export interface RiskPractice extends EffectivePractice {
  domain_name: string
  abbreviation: string
}

export const RISK_STATUSES: Status[] = ['Not Started', 'In Progress', 'Implemented', 'Audit Ready']
export const RISK_FRAMEWORKS: Framework[] = ['CMMC', 'ITAR']

export function ownershipLabel(practice: RiskPractice): 'Shared' | 'Validation required' | 'OSC' {
  if (practice.requires_validation) return 'Validation required'
  if (practice.is_shared_responsibility) return 'Shared'
  return 'OSC'
}

export function ownershipTone(practice: RiskPractice) {
  if (practice.requires_validation) return 'border-amber-950/70 bg-amber-950/20 text-amber-200'
  if (practice.is_shared_responsibility) return 'border-sky-950/70 bg-sky-950/20 text-sky-200'
  return 'border-emerald-950/60 bg-emerald-950/15 text-emerald-200'
}

export function buildRiskDomains(practices: RiskPractice[]): string[] {
  return [...new Set(practices.map((practice) => practice.abbreviation))].sort()
}

export function filterAndSortRiskPractices(
  practices: RiskPractice[],
  filters: {
    frameworkFilter: string
    statusFilter: string
    domainFilter: string
    sortKey: 'risk' | 'due_date'
  },
): RiskPractice[] {
  return practices
    .filter((practice) => {
      if (filters.frameworkFilter !== 'all' && practice.framework !== filters.frameworkFilter) return false
      if (filters.statusFilter !== 'all' && effectivePracticeStatus(practice) !== filters.statusFilter) return false
      if (filters.domainFilter !== 'all' && practice.abbreviation !== filters.domainFilter) return false
      return true
    })
    .sort((a, b) => {
      if (filters.sortKey === 'risk') {
        const riskOrder: Record<RiskLevel, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
        const diff = riskOrder[a.risk_level] - riskOrder[b.risk_level]
        if (diff !== 0) return diff
      }
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return a.due_date.localeCompare(b.due_date)
    })
}

export function buildRiskSummary(practices: RiskPractice[], filteredCount: number) {
  const criticalCount = practices.filter((practice) => practice.risk_level === 'Critical').length
  const dueSoonCount = practices.filter((practice) => {
    if (!practice.due_date) return false
    const today = new Date()
    const due = new Date(practice.due_date)
    const days = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    return days <= 14
  }).length

  return {
    criticalCount,
    dueSoonCount,
    filteredCount,
  }
}

export function formatRiskDueDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
