'use client'

import { useMemo, useState } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import { RiskBadge } from '@/components/RiskBadge'
import { FrameworkBadge } from '@/components/FrameworkBadge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { effectivePracticeStatus } from '@/lib/overlay-scoring'
import {
  buildRiskDomains,
  buildRiskSummary,
  filterAndSortRiskPractices,
  formatRiskDueDate,
  ownershipLabel,
  ownershipTone,
  RISK_FRAMEWORKS,
  RISK_STATUSES,
  type RiskPractice,
} from './risk-page-data'

interface RiskTableProps {
  practices: RiskPractice[]
}

export function RiskTable({ practices }: RiskTableProps) {
  const [frameworkFilter, setFrameworkFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [domainFilter, setDomainFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<'risk' | 'due_date'>('risk')

  const domains = useMemo(() => buildRiskDomains(practices), [practices])
  const filteredPractices = useMemo(
    () => filterAndSortRiskPractices(practices, { frameworkFilter, statusFilter, domainFilter, sortKey }),
    [practices, frameworkFilter, statusFilter, domainFilter, sortKey],
  )
  const summary = useMemo(() => buildRiskSummary(practices, filteredPractices.length), [practices, filteredPractices.length])

  return (
    <>
      <section className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="space-y-4">
          <p className="command-kicker">Risk command surface</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Risk Tracker</h1>
          <p className="max-w-[44rem] text-sm leading-6 text-muted-foreground">
            Review the highest-risk CMMC and ITAR controls first, then work downward by urgency and due date. CSP-covered controls are removed from triage pressure, while shared and validation-required controls remain in view.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="command-panel px-4 py-3">
              <div className="text-2xl font-semibold tabular-nums text-red-300">{summary.criticalCount}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Critical exposure</div>
            </div>
            <div className="command-panel px-4 py-3">
              <div className="text-2xl font-semibold tabular-nums text-amber-300">{summary.dueSoonCount}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Due in 14 days</div>
            </div>
            <div className="command-panel px-4 py-3">
              <div className="text-2xl font-semibold tabular-nums text-foreground">{summary.filteredCount}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Items in view</div>
            </div>
          </div>
        </div>

        <div className="command-panel p-4">
          <p className="command-kicker">Immediate Triage</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="w-36">
              <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
                <SelectTrigger className="h-8 border-border/80 bg-card/40 text-xs">
                  <SelectValue placeholder="All frameworks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All frameworks</SelectItem>
                  {RISK_FRAMEWORKS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <Select value={domainFilter} onValueChange={setDomainFilter}>
                <SelectTrigger className="h-8 border-border/80 bg-card/40 text-xs">
                  <SelectValue placeholder="All domains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All domains</SelectItem>
                  {domains.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 border-border/80 bg-card/40 text-xs">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {RISK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as 'risk' | 'due_date')}>
                <SelectTrigger className="h-8 border-border/80 bg-card/40 text-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="risk">Sort: Risk level</SelectItem>
                  <SelectItem value="due_date">Sort: Due date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <div className="command-table-shell">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[130px]">Practice ID</TableHead>
              <TableHead className="w-[70px]">Framework</TableHead>
              <TableHead className="w-[60px]">Domain</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[160px]">Ownership</TableHead>
              <TableHead className="w-[90px]">Risk</TableHead>
              <TableHead className="w-[130px]">Owner</TableHead>
              <TableHead className="w-[110px]">Due Date</TableHead>
              <TableHead className="w-[130px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPractices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                  No high or critical practices match the current triage filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredPractices.map((practice) => (
                <TableRow key={practice.id}>
                  <TableCell><span className="font-mono text-xs text-muted-foreground">{practice.practice_id}</span></TableCell>
                  <TableCell><FrameworkBadge framework={practice.framework} /></TableCell>
                  <TableCell><span className="font-mono text-xs font-semibold text-foreground">{practice.abbreviation}</span></TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span className="text-sm">{practice.title}</span>
                      {practice.customer_actions && (
                        <p className="text-xs text-muted-foreground">{practice.customer_actions}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${ownershipTone(practice)}`}>
                      {ownershipLabel(practice)}
                    </span>
                  </TableCell>
                  <TableCell><RiskBadge risk={practice.risk_level} /></TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{practice.owner ?? '—'}</span></TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{formatRiskDueDate(practice.due_date)}</span></TableCell>
                  <TableCell><StatusBadge status={effectivePracticeStatus(practice)} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
