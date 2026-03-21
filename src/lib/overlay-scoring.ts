import type { EffectivePractice, Practice } from '@/lib/types'

export interface BaselineTotals {
  total: number
  not_started: number
  in_progress: number
  implemented: number
  audit_ready: number
  score_pct: number
}

export interface ResidualTotals extends BaselineTotals {
  customer_owned_total: number
  full: number
  partial: number
  none: number
  validation_required: number
}

export interface ResidualDomainCompletion {
  domain_id: number
  total: number
  implemented: number
  audit_ready: number
  in_progress: number
  not_started: number
  completion_pct: number
}

export interface CoverageTotals {
  total: number
  not_started: number
  in_progress: number
  osc_complete: number
  csp_inherited: number
  total_covered: number
  customer_owned_remaining: number
  score_pct: number
}

export interface CoverageDomainCompletion {
  domain_id: number
  total: number
  not_started: number
  in_progress: number
  osc_complete: number
  csp_inherited: number
  total_covered: number
  customer_owned_remaining: number
  completion_pct: number
}

function isCompleteStatus(status: Practice['status']) {
  return status === 'Implemented' || status === 'Audit Ready'
}

export function effectivePracticeStatus(
  practice: Pick<Practice, 'status'> & Partial<Pick<EffectivePractice, 'effective_inheritance_type'>>,
): Practice['status'] {
  if (practice.effective_inheritance_type === 'full') return 'Implemented'
  if (
    (practice.effective_inheritance_type === 'partial' || practice.effective_inheritance_type === 'validation_required')
    && practice.status === 'Not Started'
  ) {
    return 'In Progress'
  }
  return practice.status
}

function isCustomerOwned(practice: Pick<EffectivePractice, 'effective_inheritance_type'>) {
  return practice.effective_inheritance_type !== 'full'
}

function isCovered(practice: Pick<EffectivePractice, 'effective_inheritance_type' | 'status'>) {
  return isCompleteStatus(effectivePracticeStatus(practice))
}

export function computeBaselineTotals(practices: Pick<Practice, 'status'>[]): BaselineTotals {
  const totals = practices.reduce(
    (acc, practice) => {
      acc.total += 1
      if (practice.status === 'Not Started') acc.not_started += 1
      if (practice.status === 'In Progress') acc.in_progress += 1
      if (practice.status === 'Implemented') acc.implemented += 1
      if (practice.status === 'Audit Ready') acc.audit_ready += 1
      return acc
    },
    {
      total: 0,
      not_started: 0,
      in_progress: 0,
      implemented: 0,
      audit_ready: 0,
    },
  )

  return {
    ...totals,
    score_pct: totals.total > 0
      ? Math.round(((totals.implemented + totals.audit_ready) / totals.total) * 100)
      : 0,
  }
}

export function computeResidualTotals(practices: EffectivePractice[]): ResidualTotals {
  const totals = practices.reduce(
    (acc, practice) => {
      acc.total += 1
      if (practice.effective_inheritance_type === 'full') acc.full += 1
      else if (practice.effective_inheritance_type === 'partial') acc.partial += 1
      else if (practice.effective_inheritance_type === 'validation_required') acc.validation_required += 1
      else acc.none += 1

      if (isCustomerOwned(practice)) {
        acc.customer_owned_total += 1
        const effectiveStatus = effectivePracticeStatus(practice)
        if (effectiveStatus === 'Not Started') acc.not_started += 1
        if (effectiveStatus === 'In Progress') acc.in_progress += 1
        if (effectiveStatus === 'Implemented') acc.implemented += 1
        if (effectiveStatus === 'Audit Ready') acc.audit_ready += 1
      }

      return acc
    },
    {
      total: 0,
      customer_owned_total: 0,
      full: 0,
      partial: 0,
      none: 0,
      validation_required: 0,
      not_started: 0,
      in_progress: 0,
      implemented: 0,
      audit_ready: 0,
    },
  )

  return {
    ...totals,
    score_pct: totals.customer_owned_total > 0
      ? Math.round(((totals.implemented + totals.audit_ready) / totals.customer_owned_total) * 100)
      : 0,
  }
}

export function computeCoverageTotals(practices: EffectivePractice[]): CoverageTotals {
  const totals = practices.reduce(
    (acc, practice) => {
      acc.total += 1

      if (practice.effective_inheritance_type === 'full') {
        acc.csp_inherited += 1
        acc.total_covered += 1
        return acc
      }

      const effectiveStatus = effectivePracticeStatus(practice)
      if (effectiveStatus === 'Not Started') acc.not_started += 1
      if (effectiveStatus === 'In Progress') acc.in_progress += 1
      if (isCompleteStatus(effectiveStatus)) {
        acc.osc_complete += 1
        acc.total_covered += 1
        return acc
      }

      acc.customer_owned_remaining += 1
      return acc
    },
    {
      total: 0,
      not_started: 0,
      in_progress: 0,
      osc_complete: 0,
      csp_inherited: 0,
      total_covered: 0,
      customer_owned_remaining: 0,
    },
  )

  return {
    ...totals,
    score_pct: totals.total > 0
      ? Math.round((totals.total_covered / totals.total) * 100)
      : 0,
  }
}

export function computeResidualBlockerCount(practices: EffectivePractice[]): number {
  return practices.filter((practice) => {
    if (!isCustomerOwned(practice)) return false
    if (isCompleteStatus(effectivePracticeStatus(practice))) return false
    return practice.risk_level === 'High' || practice.risk_level === 'Critical'
  }).length
}

export function computePerDomainResidualCompletion(
  practices: EffectivePractice[],
): ResidualDomainCompletion[] {
  const grouped = new Map<number, EffectivePractice[]>()

  for (const practice of practices) {
    const current = grouped.get(practice.domain_id) ?? []
    current.push(practice)
    grouped.set(practice.domain_id, current)
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => a - b)
    .map(([domain_id, domainPractices]) => {
      const summary = domainPractices.reduce(
        (acc, practice) => {
          if (!isCustomerOwned(practice)) return acc
          acc.total += 1
          const effectiveStatus = effectivePracticeStatus(practice)
          if (effectiveStatus === 'Implemented') acc.implemented += 1
          if (effectiveStatus === 'Audit Ready') acc.audit_ready += 1
          if (effectiveStatus === 'In Progress') acc.in_progress += 1
          if (effectiveStatus === 'Not Started') acc.not_started += 1
          return acc
        },
        {
          total: 0,
          implemented: 0,
          audit_ready: 0,
          in_progress: 0,
          not_started: 0,
        },
      )

      return {
        domain_id,
        ...summary,
        completion_pct: summary.total > 0
          ? Math.round(((summary.implemented + summary.audit_ready) / summary.total) * 100)
          : 100,
      }
    })
}

export function computePerDomainCoverageCompletion(
  practices: EffectivePractice[],
): CoverageDomainCompletion[] {
  const grouped = new Map<number, EffectivePractice[]>()

  for (const practice of practices) {
    const current = grouped.get(practice.domain_id) ?? []
    current.push(practice)
    grouped.set(practice.domain_id, current)
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => a - b)
    .map(([domain_id, domainPractices]) => {
      const summary = domainPractices.reduce(
        (acc, practice) => {
          acc.total += 1

          if (practice.effective_inheritance_type === 'full') {
            acc.csp_inherited += 1
            acc.total_covered += 1
            return acc
          }

          const effectiveStatus = effectivePracticeStatus(practice)

          if (effectiveStatus === 'Not Started') {
            acc.not_started += 1
            acc.customer_owned_remaining += 1
            return acc
          }

          if (effectiveStatus === 'In Progress') {
            acc.in_progress += 1
            acc.customer_owned_remaining += 1
            return acc
          }

          if (isCovered(practice)) {
            acc.osc_complete += 1
            acc.total_covered += 1
          }

          return acc
        },
        {
          total: 0,
          not_started: 0,
          in_progress: 0,
          osc_complete: 0,
          csp_inherited: 0,
          total_covered: 0,
          customer_owned_remaining: 0,
        },
      )

      return {
        domain_id,
        ...summary,
        completion_pct: summary.total > 0
          ? Math.round((summary.total_covered / summary.total) * 100)
          : 0,
      }
    })
}
