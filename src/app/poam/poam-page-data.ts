import type { PoamItem, PoamStatus } from '@/lib/types'

export const STATUS_COLORS: Record<PoamStatus, string> = {
  Open: 'text-red-300 bg-red-950/30 border-red-900/70',
  'In Progress': 'text-amber-300 bg-amber-950/30 border-amber-900/70',
  Closed: 'text-green-300 bg-green-950/30 border-green-900/70',
}

export const STATUSES: PoamStatus[] = ['Open', 'In Progress', 'Closed']


export type PoamFormState = {
  finding: string
  practiceId: string
  owner: string
  resources: string
  date: string
}

const FINDING_TEMPLATE = `GAP STATEMENT
What is missing or weak:


ROOT CAUSE
Why the gap exists:


REMEDIATION PLAN
Actions:
Owner:
Due date:
Dependencies:


CLOSURE EVIDENCE
What must exist before this can be closed:`

export function createEmptyPoamForm(): PoamFormState {
  return {
    finding: FINDING_TEMPLATE,
    practiceId: '',
    owner: '',
    resources: '',
    date: '',
  }
}

export function scopePoamItems(
  items: PoamItem[],
  overlayActive: boolean,
  customerOwnedPracticeIds: Set<string> | null,
): PoamItem[] {
  return items.filter((item) => {
    if (!overlayActive || customerOwnedPracticeIds === null) return true
    if (!item.practice_id) return true
    return customerOwnedPracticeIds.has(item.practice_id)
  })
}

export function filterPoamItems(items: PoamItem[], statusFilter: string): PoamItem[] {
  return items.filter((item) => statusFilter === 'all' || item.status === statusFilter)
}

export function buildPoamSummary(items: PoamItem[]) {
  return {
    openCount: items.filter((item) => item.status === 'Open').length,
    inProgressCount: items.filter((item) => item.status === 'In Progress').length,
    closedCount: items.filter((item) => item.status === 'Closed').length,
  }
}

export function formatScheduledCompletion(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

