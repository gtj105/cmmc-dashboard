'use client'

import { useState, useCallback, useEffect } from 'react'
import type { EffectivePractice, Practice, Status, RiskLevel } from '@/lib/types'
import { StatusBadge } from '@/components/StatusBadge'
import { RiskBadge } from '@/components/RiskBadge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { effectivePracticeStatus } from '@/lib/overlay-scoring'

const STATUSES: Status[] = ['Not Started', 'In Progress', 'Implemented', 'Audit Ready']
const RISKS: RiskLevel[] = ['Low', 'Medium', 'High', 'Critical']
type TablePractice = Practice | EffectivePractice

interface PracticeTableProps {
  practices: TablePractice[]
  onUpdate?: () => void  // callback to refresh parent data after mutation
  canEdit?: boolean
}

function isEffectivePractice(practice: TablePractice): practice is EffectivePractice {
  return 'effective_inheritance_type' in practice
}

function ownershipLabel(practice: TablePractice): 'CSP' | 'Shared' | 'Validation required' | 'OSC' {
  if (!isEffectivePractice(practice)) return 'OSC'
  if (practice.is_fully_inherited) return 'CSP'
  if (practice.requires_validation) return 'Validation required'
  if (practice.is_shared_responsibility) return 'Shared'
  return 'OSC'
}

function ownershipTone(practice: TablePractice): string {
  const label = ownershipLabel(practice)
  if (label === 'CSP') return 'border-sky-950/70 bg-sky-950/15 text-sky-200'
  if (label === 'Validation required') return 'border-amber-950/70 bg-amber-950/20 text-amber-200'
  if (label === 'Shared') return 'border-border/70 bg-muted/20 text-muted-foreground'
  return 'border-emerald-950/60 bg-emerald-950/15 text-emerald-200'
}

function isFullyInheritedReadOnly(practice: TablePractice): boolean {
  return isEffectivePractice(practice) && practice.is_fully_inherited
}

async function patchPractice(id: number, updates: Record<string, unknown>) {
  const res = await fetch(`/api/practices/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error('Failed to update practice')
  return res.json()
}

export function PracticeTable({ practices: initialPractices, onUpdate, canEdit = true }: PracticeTableProps) {
  const [practices, setPractices] = useState(initialPractices)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [updating, setUpdating] = useState<Set<number>>(new Set())
  const [justUpdated, setJustUpdated] = useState<Map<number, Status>>(new Map())

  useEffect(() => {
    setPractices(initialPractices)
  }, [initialPractices])

  const showOwnership = practices.some((practice) => isEffectivePractice(practice))

  const filtered = practices
    .filter((p) => {
      if (statusFilter !== 'all' && effectivePracticeStatus(p) !== statusFilter) return false
      if (riskFilter !== 'all' && p.risk_level !== riskFilter) return false
      return true
    })
    .sort((a, b) => {
      if (!showOwnership) return 0

      const rank = (practice: TablePractice) => {
        if (!isEffectivePractice(practice)) return 1
        if (practice.is_fully_inherited) return 3
        if (practice.requires_validation) return 0
        if (practice.is_shared_responsibility) return 1
        return 2
      }

      const rankDelta = rank(a) - rank(b)
      if (rankDelta !== 0) return rankDelta
      return a.practice_id.localeCompare(b.practice_id)
    })

  const updatePractice = useCallback(async (id: number, updates: Record<string, unknown>) => {
    setUpdating((prev) => new Set(prev).add(id))
    try {
      const updated = await patchPractice(id, updates)
      setPractices((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)))
      onUpdate?.()
      const newStatus = (updates.status ?? updated.status) as Status
      setJustUpdated((prev) => new Map(prev).set(id, newStatus))
      setTimeout(() => setJustUpdated((prev) => { const m = new Map(prev); m.delete(id); return m }), 700)
    } catch (err) {
      console.error('Update failed:', err)
    } finally {
      setUpdating((prev) => { const s = new Set(prev); s.delete(id); return s })
    }
  }, [onUpdate])

  return (
    <div className="space-y-4">
      <div className="border-b border-border pb-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="command-kicker">Operational view</p>
            {showOwnership && (
              <p className="text-[11px] text-muted-foreground">
                CSP = Cloud Service Provider · OSC = Organization Seeking Certification
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-44">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 border-border bg-card text-xs">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="h-8 border-border bg-card text-xs">
                    <SelectValue placeholder="All risks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All risks</SelectItem>
                    {RISKS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="command-kicker">Command filters</p>
            <p className="mt-2 text-sm text-foreground">
              {filtered.length} <span className="text-muted-foreground">of {practices.length} controls in scope</span>
            </p>
          </div>
        </div>
      </div>

      <div className="command-table-shell">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Practice ID</TableHead>
            <TableHead>Title</TableHead>
            {showOwnership && <TableHead className="w-[160px]">Ownership</TableHead>}
            <TableHead className="w-[150px]">Status</TableHead>
            <TableHead className="w-[90px]">Risk</TableHead>
            <TableHead className="w-[140px]">Owner</TableHead>
            <TableHead className="w-[130px]">Due Date</TableHead>
            <TableHead className="w-[80px] text-center">Evidence</TableHead>
            <TableHead className="w-[200px]">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showOwnership ? 9 : 8} className="text-center py-8 text-muted-foreground text-sm">
                No practices match the current filters.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((practice) => (
              (() => {
                const fullyInheritedReadOnly = isFullyInheritedReadOnly(practice)
                const editDisabled = !canEdit || updating.has(practice.id) || fullyInheritedReadOnly
                const displayStatus = isEffectivePractice(practice) ? effectivePracticeStatus(practice) : practice.status

                return (
                  <TableRow
                    key={practice.id}
                    className={[
                      fullyInheritedReadOnly ? 'opacity-55' : '',
                      updating.has(practice.id) ? 'opacity-60' : '',
                      justUpdated.has(practice.id)
                        ? justUpdated.get(practice.id) === 'Audit Ready' ? 'status-flash-green'
                          : justUpdated.get(practice.id) === 'Not Started' ? 'status-flash-red'
                          : 'status-flash-amber'
                        : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <TableCell>
                  <span className="font-mono text-xs text-muted-foreground">
                    {practice.practice_id}
                  </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="text-sm">{practice.title}</span>
                        {isEffectivePractice(practice) && practice.customer_actions && (
                          <p className="text-xs text-muted-foreground">{practice.customer_actions}</p>
                        )}
                        {fullyInheritedReadOnly && (
                          <p className="text-xs text-muted-foreground">CSP covered. This row counts toward progress and stays quiet in immediate-attention views.</p>
                        )}
                      </div>
                    </TableCell>
                    {showOwnership && (
                      <TableCell>
                        <div className="space-y-1">
                          <span className={`inline-flex border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${ownershipTone(practice)}`}>
                            {ownershipLabel(practice)}
                          </span>
                          {isEffectivePractice(practice) && practice.overlay_pack_name && (
                            <p className="text-xs text-muted-foreground">{practice.overlay_pack_name}</p>
                          )}
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Select
                        value={displayStatus}
                        onValueChange={(value) =>
                          updatePractice(practice.id, { status: value as Status })
                        }
                        disabled={editDisabled}
                      >
                        <SelectTrigger className="h-8 border-border/40 bg-card/30 px-2 hover:bg-accent/40 focus:ring-0">
                          <SelectValue>
                            <StatusBadge status={displayStatus} />
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              <StatusBadge status={s} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <RiskBadge risk={practice.risk_level} />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 text-xs border-border/50 bg-card/50 focus:bg-card"
                        defaultValue={practice.owner ?? ''}
                        placeholder="Assign owner"
                        onBlur={(e) => {
                          const newVal = e.target.value.trim()
                          if (newVal !== (practice.owner ?? '')) {
                            updatePractice(practice.id, { owner: newVal || null })
                          }
                        }}
                        disabled={editDisabled}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        className="h-8 text-xs border-border/50 bg-card/50 focus:bg-card"
                        defaultValue={practice.due_date ?? ''}
                        onBlur={(e) => {
                          const newVal = e.target.value || null
                          if (newVal !== practice.due_date) {
                            updatePractice(practice.id, { due_date: newVal })
                          }
                        }}
                        disabled={editDisabled}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={practice.evidence_exists}
                        onCheckedChange={(checked) =>
                          updatePractice(practice.id, { evidence_exists: checked })
                        }
                        disabled={editDisabled}
                        aria-label="Evidence exists"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        className="min-h-0 h-8 resize-none text-xs border-border/50 bg-card/50 py-1.5 focus:bg-card"
                        defaultValue={practice.notes ?? ''}
                        placeholder="Add notes..."
                        onBlur={(e) => {
                          const newVal = e.target.value.trim()
                          if (newVal !== (practice.notes ?? '')) {
                            updatePractice(practice.id, { notes: newVal || null })
                          }
                        }}
                        disabled={editDisabled}
                        rows={1}
                      />
                    </TableCell>
                  </TableRow>
                )
              })()
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}
