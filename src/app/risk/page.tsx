'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/StatusBadge'
import { RiskBadge } from '@/components/RiskBadge'
import { FrameworkBadge } from '@/components/FrameworkBadge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import type { Practice, Status, Framework, RiskLevel } from '@/lib/types'

interface RiskPractice extends Practice {
  domain_name: string
  abbreviation: string
}

export default function RiskPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [practices, setPractices] = useState<RiskPractice[]>([])
  const [loading, setLoading] = useState(true)
  const [frameworkFilter, setFrameworkFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [domainFilter, setDomainFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<'risk' | 'due_date'>('risk')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/risk')
      .then((r) => r.json())
      .then((data) => { setPractices(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status])

  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? 'My Organization'

  const domains = [...new Set(practices.map((p) => p.abbreviation))].sort()

  const STATUSES: Status[] = ['Not Started', 'In Progress', 'Implemented', 'Audit Ready']
  const FRAMEWORKS: Framework[] = ['CMMC', 'ITAR']

  const filtered = practices
    .filter((p) => {
      if (frameworkFilter !== 'all' && p.framework !== frameworkFilter) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (domainFilter !== 'all' && p.abbreviation !== domainFilter) return false
      return true
    })
    .sort((a, b) => {
      if (sortKey === 'risk') {
        const riskOrder: Record<RiskLevel, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
        const diff = riskOrder[a.risk_level] - riskOrder[b.risk_level]
        if (diff !== 0) return diff
      }
      // Due date sort (NULLS LAST)
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return a.due_date.localeCompare(b.due_date)
    })

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <AppShell orgName={orgName}>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Risk Tracker</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            High and Critical risk practices across CMMC and ITAR
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex gap-3 items-center flex-wrap">
          <div className="w-36">
            <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All frameworks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All frameworks</SelectItem>
                {FRAMEWORKS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-36">
            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger className="h-8 text-xs">
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
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-36">
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as 'risk' | 'due_date')}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="risk">Sort: Risk level</SelectItem>
                <SelectItem value="due_date">Sort: Due date</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} practices
          </span>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[130px]">Practice ID</TableHead>
              <TableHead className="w-[70px]">Framework</TableHead>
              <TableHead className="w-[60px]">Domain</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[90px]">Risk</TableHead>
              <TableHead className="w-[130px]">Owner</TableHead>
              <TableHead className="w-[110px]">Due Date</TableHead>
              <TableHead className="w-[130px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                  No high/critical risk practices match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">{p.practice_id}</span>
                  </TableCell>
                  <TableCell>
                    <FrameworkBadge framework={p.framework} />
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold text-primary">{p.abbreviation}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{p.title}</span>
                  </TableCell>
                  <TableCell>
                    <RiskBadge risk={p.risk_level} />
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{p.owner ?? '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {p.due_date ? new Date(p.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  )
}
