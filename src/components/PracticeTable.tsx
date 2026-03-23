'use client'

import React, { useState, useCallback, useEffect } from 'react'
import type { EffectivePractice, Practice, Status, RiskLevel } from '@/lib/types'
import { StatusBadge } from '@/components/StatusBadge'
import { RiskBadge } from '@/components/RiskBadge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { effectivePracticeStatus } from '@/lib/overlay-scoring'
import { EvidenceDrawer } from '@/components/EvidenceDrawer'
import { ASSESSMENT_OBJECTIVES } from '@/lib/assessment-objectives'
import { CustomerActions } from '@/components/CustomerActions'

export type ObjectiveStatus = 'met' | 'partial' | 'not_met' | 'not_assessed'

const OBJECTIVE_STATUS_STYLES: Record<ObjectiveStatus, string> = {
  met: 'border-green-800/60 bg-green-950/20 text-green-300',
  partial: 'border-amber-800/60 bg-amber-950/20 text-amber-300',
  not_met: 'border-red-800/60 bg-red-950/20 text-red-300',
  not_assessed: 'border-border/50 bg-card/20 text-muted-foreground',
}
const OBJECTIVE_STATUS_LABELS: Record<ObjectiveStatus, string> = {
  met: 'Met',
  partial: 'Partial',
  not_met: 'Not Met',
  not_assessed: 'Not Assessed',
}

export function ObjectiveStatusBadge({ status }: { status: string }) {
  const s = (status as ObjectiveStatus) in OBJECTIVE_STATUS_STYLES ? (status as ObjectiveStatus) : 'not_assessed'
  return (
    <span className={`shrink-0 border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] font-medium ${OBJECTIVE_STATUS_STYLES[s]}`}>
      {OBJECTIVE_STATUS_LABELS[s]}
    </span>
  )
}

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
  const [evidenceCounts, setEvidenceCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(practices.map((p) => [p.practice_id, p.evidence_count ?? 0]))
  )
  const [drawerPracticeId, setDrawerPracticeId] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [objectiveStatuses, setObjectiveStatuses] = useState<Record<string, Record<string, string>>>({})

  async function toggleRow(practiceId: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(practiceId)) { next.delete(practiceId); return next }
      next.add(practiceId)
      return next
    })
    if (!objectiveStatuses[practiceId]) {
      try {
        const res = await fetch(`/api/practices/${practiceId}/objectives`)
        if (res.ok) {
          const data = await res.json()
          setObjectiveStatuses((prev) => ({ ...prev, [practiceId]: data }))
        }
      } catch {
        // silently keep empty — objectives still display, just without saved statuses
      }
    }
  }

  function handleEvidenceCountChange(practiceId: string, delta: number) {
    setEvidenceCounts((prev) => ({
      ...prev,
      [practiceId]: Math.max(0, (prev[practiceId] ?? 0) + delta),
    }))
  }

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
    .sort((a, b) => a.practice_id.localeCompare(b.practice_id, undefined, { numeric: true }))

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
                  <React.Fragment key={practice.id}>
                  <TableRow
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
                      <div className="flex items-center gap-1.5">
                        {ASSESSMENT_OBJECTIVES[practice.practice_id] && (
                          <button
                            onClick={() => toggleRow(practice.practice_id)}
                            className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                            title="Toggle assessment objectives"
                          >
                            <svg className={`h-3 w-3 transition-transform ${expandedRows.has(practice.practice_id) ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                        <span className="font-mono text-xs text-muted-foreground">
                          {practice.practice_id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="text-sm">{practice.title}</span>
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
                    <TableCell className="min-w-0">
                      <Input
                        className="h-8 text-xs border-border/50 bg-card/50 focus:bg-card truncate"
                        defaultValue={practice.owner ?? ''}
                        placeholder="Assign owner"
                        maxLength={100}
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
                    <TableCell>
                    <button
                      onClick={() => setDrawerPracticeId(practice.practice_id)}
                      className={`text-[10px] uppercase tracking-[0.14em] px-2 py-1 border transition-colors ${
                        (evidenceCounts[practice.practice_id] ?? 0) > 0
                          ? 'border-green-800/60 bg-green-950/20 text-green-300 hover:bg-green-950/40'
                          : 'border-border/50 bg-card/20 text-muted-foreground hover:bg-card/40'
                      }`}
                    >
                      {evidenceCounts[practice.practice_id] ?? 0}{' '}
                      {(evidenceCounts[practice.practice_id] ?? 0) === 1 ? 'item' : 'items'}
                    </button>
                    </TableCell>
                    <TableCell>
                      <Textarea
                        className="min-h-0 h-8 resize-none text-xs border-border/50 bg-card/50 py-1.5 focus:bg-card"
                        defaultValue={practice.notes ?? ''}
                        placeholder="Add notes..."
                        maxLength={2000}
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
                  {expandedRows.has(practice.practice_id) && ASSESSMENT_OBJECTIVES[practice.practice_id] && (
                    <TableRow key={`${practice.id}-objectives`} className="expanded-row-enter bg-card/20 hover:bg-card/20">
                      <TableCell />
                      <TableCell colSpan={showOwnership ? 8 : 7} className="pb-4 pt-2">
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2">Assessment Objectives — NIST SP 800-171A</p>
                          {ASSESSMENT_OBJECTIVES[practice.practice_id].map((obj) => {
                            const status = objectiveStatuses[practice.practice_id]?.[obj.letter]
                            return (
                              <div key={obj.letter} className="flex items-start gap-2.5">
                                <span className="mt-px shrink-0 font-mono text-[10px] text-sky-500/60 w-4">[{obj.letter}]</span>
                                <span className="text-xs text-foreground/80 flex-1">{obj.text}</span>
                                <ObjectiveStatusBadge status={status ?? 'not_assessed'} />
                              </div>
                            )
                          })}
                          {isEffectivePractice(practice) && practice.customer_actions && (
                            <div className="mt-3 border-t border-border/40 pt-3 space-y-1.5">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                Microsoft Implementation Guidance
                                {practice.overlay_pack_name && (
                                  <span className="ml-2 normal-case tracking-normal font-normal text-muted-foreground/60">— {practice.overlay_pack_name}</span>
                                )}
                              </p>
                              <CustomerActions text={practice.customer_actions} />
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  </React.Fragment>
                )
              })()
            ))
          )}
        </TableBody>
      </Table>
      </div>
      <EvidenceDrawer
        practiceId={drawerPracticeId}
        practiceTitle={
          practices.find((p) => p.practice_id === drawerPracticeId)?.title ?? ''
        }
        canEdit={canEdit}
        onClose={() => setDrawerPracticeId(null)}
        onCountChange={handleEvidenceCountChange}
      />
    </div>
  )
}
