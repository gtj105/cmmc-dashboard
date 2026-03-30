'use client'

import React, { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { PracticePicker } from '@/components/ui/practice-picker'
import type { PoamItem, PoamHistoryEntry, PoamStatus } from '@/lib/types'
import {
  buildPoamSummary,
  createEmptyPoamForm,
  filterPoamItems,
  formatScheduledCompletion,
  STATUSES,
  STATUS_COLORS,
  type PoamFormState,
} from './poam-page-data'

interface PoamTableProps {
  initialItems: PoamItem[]
  canEdit: boolean
  isAdmin: boolean
}

// ── Textarea helper ────────────────────────────────────────────────────────────

function FieldTextarea({
  label,
  required,
  value,
  onChange,
  hint,
  rows = 4,
}: {
  label: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  hint?: string
  rows?: number
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
        {label}{required && <span className="ml-1 text-red-400">*</span>}
      </label>
      <textarea
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={5000}
        className="w-full resize-y border border-border/70 bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {hint && <p className="text-[10px] text-amber-400/80">{hint}</p>}
    </div>
  )
}

// ── Shared form fields (used by both create and edit forms) ────────────────────

function PoamFormFields({
  form,
  onChange,
  isClosing,
}: {
  form: PoamFormState
  onChange: (patch: Partial<PoamFormState>) => void
  isClosing: boolean
}) {
  return (
    <div className="space-y-3">
      <FieldTextarea
        label="Gap Statement"
        required
        value={form.gapStatement}
        onChange={(v) => onChange({ gapStatement: v })}
        rows={5}
      />
      <FieldTextarea
        label="Root Cause"
        value={form.rootCause}
        onChange={(v) => onChange({ rootCause: v })}
      />
      <FieldTextarea
        label="Remediation Plan"
        value={form.remediationPlan}
        onChange={(v) => onChange({ remediationPlan: v })}
        hint={isClosing ? 'Required to close' : undefined}
      />
      <FieldTextarea
        label="Closure Evidence"
        value={form.closureEvidence}
        onChange={(v) => onChange({ closureEvidence: v })}
        hint={isClosing ? 'Required to close' : undefined}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <PracticePicker
          value={form.practiceId}
          onChange={(v) => onChange({ practiceId: v })}
        />
        <input
          type="text"
          placeholder="Responsible individual"
          value={form.owner}
          maxLength={100}
          onChange={(e) => onChange({ owner: e.target.value })}
          className="border border-border/70 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="text"
          placeholder="Resources required"
          value={form.resources}
          maxLength={500}
          onChange={(e) => onChange({ resources: e.target.value })}
          className="border border-border/70 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <DatePicker
          value={form.date}
          onChange={(v) => onChange({ date: v })}
        />
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PoamTable({ initialItems, canEdit, isAdmin }: PoamTableProps) {
  const [items, setItems] = useState<PoamItem[]>(initialItems)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<PoamFormState>(createEmptyPoamForm())
  const [editSaving, setEditSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<PoamFormState>(createEmptyPoamForm())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Archive state
  const [archiveConfirmId, setArchiveConfirmId] = useState<number | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [archivedItems, setArchivedItems] = useState<PoamItem[]>([])
  const [archivedLoading, setArchivedLoading] = useState(false)

  // History state
  const [historyExpandedIds, setHistoryExpandedIds] = useState<Set<number>>(new Set())
  const [historyData, setHistoryData] = useState<Record<number, PoamHistoryEntry[]>>({})
  const [historyLoading, setHistoryLoading] = useState<Set<number>>(new Set())

  const filteredItems = useMemo(() => filterPoamItems(items, statusFilter), [items, statusFilter])
  const summary = useMemo(() => buildPoamSummary(items), [items])

  const showError = useCallback((msg: string) => {
    setSaveError(msg)
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    dismissTimer.current = setTimeout(() => setSaveError(null), 5000)
  }, [])

  useEffect(() => () => { if (dismissTimer.current) clearTimeout(dismissTimer.current) }, [])

  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function startEdit(item: PoamItem) {
    setEditingId(item.id)
    setEditForm({
      gapStatement: item.gap_statement,
      rootCause: item.root_cause ?? '',
      remediationPlan: item.remediation_plan ?? '',
      closureEvidence: item.closure_evidence ?? '',
      practiceId: item.practice_id ?? '',
      owner: item.responsible_individual ?? '',
      resources: item.resources_required ?? '',
      date: item.scheduled_completion ? new Date(item.scheduled_completion).toISOString().slice(0, 10) : '',
    })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId || !editForm.gapStatement.trim()) return
    setEditSaving(true)
    try {
      const res = await apiFetch(`/api/poam/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gap_statement: editForm.gapStatement,
          root_cause: editForm.rootCause || null,
          remediation_plan: editForm.remediationPlan || null,
          closure_evidence: editForm.closureEvidence || null,
          practice_id: editForm.practiceId || null,
          responsible_individual: editForm.owner || null,
          resources_required: editForm.resources || null,
          scheduled_completion: editForm.date || null,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setItems((prev) => prev.map((item) => (item.id === editingId ? updated : item)))
        setEditingId(null)
        // Invalidate cached history so it reloads on next open
        setHistoryData((prev) => { const n = { ...prev }; delete n[editingId]; return n })
      } else {
        showError('Failed to save changes.')
      }
    } catch {
      showError('Network error — changes were not saved.')
    }
    setEditSaving(false)
  }

  async function handleStatusChange(id: number, newStatus: PoamStatus) {
    if (!canEdit) return
    const previous = items.find((i) => i.id === id)?.status
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)))
    try {
      const res = await apiFetch(`/api/poam/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: previous! } : item)))
        showError(res.status === 401 ? 'Session expired — please refresh.' : 'Failed to update status. Change reverted.')
      } else {
        setHistoryData((prev) => { const n = { ...prev }; delete n[id]; return n })
      }
    } catch {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: previous! } : item)))
      showError('Network error — failed to save status change.')
    }
  }

  async function handleProgressChange(id: number, progress: number) {
    if (!canEdit) return
    const previous = items.find((i) => i.id === id)?.milestone_progress
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, milestone_progress: progress } : item)))
    try {
      const res = await apiFetch(`/api/poam/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestone_progress: progress }),
      })
      if (!res.ok) {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, milestone_progress: previous! } : item)))
        showError(res.status === 401 ? 'Session expired — please refresh.' : 'Failed to update progress. Change reverted.')
      }
    } catch {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, milestone_progress: previous! } : item)))
      showError('Network error — failed to save progress change.')
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!canEdit || !form.gapStatement.trim()) return
    setSaving(true)
    try {
      const res = await apiFetch('/api/poam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gap_statement: form.gapStatement,
          root_cause: form.rootCause || null,
          remediation_plan: form.remediationPlan || null,
          closure_evidence: form.closureEvidence || null,
          practice_id: form.practiceId || null,
          responsible_individual: form.owner || null,
          resources_required: form.resources || null,
          scheduled_completion: form.date || null,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setItems((prev) => [created, ...prev])
        setForm(createEmptyPoamForm())
        setShowForm(false)
      } else {
        showError('Failed to create item. Please try again.')
      }
    } catch {
      showError('Network error — item was not saved.')
    }
    setSaving(false)
  }

  async function handleArchive(id: number) {
    if (!isAdmin) return
    try {
      const res = await apiFetch(`/api/poam/${id}`, { method: 'DELETE' })
      if (res.ok) {
        const archived = await res.json()
        setItems((prev) => prev.filter((item) => item.id !== id))
        setArchivedItems((prev) => [archived, ...prev])
        setArchiveConfirmId(null)
      } else {
        showError(res.status === 401 ? 'Session expired — please refresh.' : 'Failed to archive item.')
      }
    } catch {
      showError('Network error — item was not archived.')
    }
  }

  async function handleRestore(id: number) {
    if (!isAdmin) return
    try {
      const res = await apiFetch(`/api/poam/${id}/restore`, { method: 'POST' })
      if (res.ok) {
        const restored = await res.json()
        setArchivedItems((prev) => prev.filter((item) => item.id !== id))
        setItems((prev) => [restored, ...prev])
      } else {
        showError('Failed to restore item.')
      }
    } catch {
      showError('Network error — item was not restored.')
    }
  }

  async function loadArchivedItems() {
    setArchivedLoading(true)
    try {
      const res = await apiFetch('/api/poam?include_archived=true')
      if (res.ok) {
        const all = await res.json() as PoamItem[]
        setArchivedItems(all.filter((i) => i.deleted_at !== null))
      }
    } catch {
      // silent — archived section shows empty
    }
    setArchivedLoading(false)
  }

  async function toggleShowArchived() {
    const next = !showArchived
    setShowArchived(next)
    if (next && archivedItems.length === 0) {
      await loadArchivedItems()
    }
  }

  async function toggleHistory(id: number) {
    setHistoryExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    if (!historyData[id] && !historyLoading.has(id)) {
      setHistoryLoading((prev) => new Set(prev).add(id))
      try {
        const res = await apiFetch(`/api/poam/${id}/history`)
        if (res.ok) {
          const rows = await res.json() as PoamHistoryEntry[]
          setHistoryData((prev) => ({ ...prev, [id]: rows }))
        }
      } finally {
        setHistoryLoading((prev) => { const n = new Set(prev); n.delete(id); return n })
      }
    }
  }

  function renderHistoryPanel(id: number) {
    const rows = historyData[id]
    const loading = historyLoading.has(id)
    return (
      <TableRow className="bg-card/10 hover:bg-card/10">
        <TableCell colSpan={8} className="px-6 py-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">Change History</p>
          {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
          {!loading && rows && rows.length === 0 && (
            <p className="text-xs text-muted-foreground">No changes recorded yet.</p>
          )}
          {!loading && rows && rows.length > 0 && (
            <div className="space-y-1">
              {rows.map((row) => (
                <div key={row.id} className="text-xs text-muted-foreground">
                  <span className="text-foreground/60">{new Date(row.changed_at).toLocaleString()}</span>
                  {' · '}
                  <span className="text-foreground/80">{row.changed_by}</span>
                  {' changed '}
                  <span className="font-mono text-foreground/80">{row.field_changed}</span>
                  {': '}
                  <span className="text-red-400/70 line-through">{row.old_value ?? '(empty)'}</span>
                  {' → '}
                  <span className="text-green-400/70">{row.new_value ?? '(empty)'}</span>
                </div>
              ))}
            </div>
          )}
        </TableCell>
      </TableRow>
    )
  }

  function renderItemRow(item: PoamItem, isArchived = false) {
    const isExpanded = expandedIds.has(item.id)
    const isHistoryExpanded = historyExpandedIds.has(item.id)
    const historyCount = historyData[item.id]?.length ?? 0

    return (
      <React.Fragment key={item.id}>
        <TableRow className={isArchived ? 'opacity-50' : ''}>
          <TableCell><span className="font-mono text-xs text-muted-foreground">{item.practice_id ?? '—'}</span></TableCell>
          <TableCell>
            <button
              type="button"
              onClick={() => toggleExpand(item.id)}
              className="flex w-full items-start gap-2 text-left"
            >
              <svg
                className={`mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/60 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
              >
                <path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="line-clamp-1 text-xs text-foreground">
                {item.gap_statement.split('\n')[0]}
              </span>
            </button>
          </TableCell>
          <TableCell><span className="text-xs text-muted-foreground">{item.responsible_individual ?? '—'}</span></TableCell>
          <TableCell><span className="text-xs text-muted-foreground">{formatScheduledCompletion(item.scheduled_completion)}</span></TableCell>
          <TableCell>
            <Select
              value={String(item.milestone_progress)}
              onValueChange={(v) => handleProgressChange(item.id, parseInt(v, 10))}
              disabled={!canEdit || isArchived}
            >
              <SelectTrigger className="h-8 w-20 border-border/70 bg-card/40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((p) => (
                  <SelectItem key={p} value={String(p)}>{p}%</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TableCell>
          <TableCell>
            <Select
              value={item.status}
              onValueChange={(v) => handleStatusChange(item.id, v as PoamStatus)}
              disabled={!canEdit || isArchived}
            >
              <SelectTrigger className={`h-8 w-28 border px-2 text-xs ${STATUS_COLORS[item.status]}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </TableCell>
          <TableCell>
            <button
              type="button"
              onClick={() => toggleHistory(item.id)}
              className="text-xs text-muted-foreground transition-colors hover:text-sky-300"
              title="Show history"
            >
              History{historyCount > 0 && (
                <span className="ml-1 rounded bg-sky-900/40 px-1 text-[10px] text-sky-300">{historyCount}</span>
              )}
            </button>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              {canEdit && !isArchived && (
                <button
                  onClick={() => editingId === item.id ? setEditingId(null) : startEdit(item)}
                  className="text-xs text-muted-foreground transition-colors hover:text-sky-300"
                  title="Edit"
                >
                  ✎
                </button>
              )}
              {isAdmin && !isArchived && archiveConfirmId !== item.id && (
                <button
                  onClick={() => setArchiveConfirmId(item.id)}
                  className="text-xs text-muted-foreground transition-colors hover:text-amber-300"
                  title="Archive"
                >
                  ⊘
                </button>
              )}
              {isAdmin && !isArchived && archiveConfirmId === item.id && (
                <span className="flex items-center gap-1 text-xs">
                  <button onClick={() => handleArchive(item.id)} className="text-amber-300 hover:text-amber-100">Archive?</button>
                  <button onClick={() => setArchiveConfirmId(null)} className="text-muted-foreground hover:text-foreground">Cancel</button>
                </span>
              )}
              {isAdmin && isArchived && (
                <button
                  onClick={() => handleRestore(item.id)}
                  className="text-xs text-green-400/70 transition-colors hover:text-green-300"
                  title="Restore"
                >
                  Restore
                </button>
              )}
            </div>
          </TableCell>
        </TableRow>

        {isExpanded && editingId !== item.id && (
          <TableRow className="bg-card/20 hover:bg-card/20">
            <TableCell colSpan={8} className="px-6 py-4">
              <div className="space-y-4 border-l-2 border-sky-500/20 pl-4">
                {([
                  { label: 'Gap Statement', value: item.gap_statement },
                  { label: 'Root Cause', value: item.root_cause },
                  { label: 'Remediation Plan', value: item.remediation_plan },
                  { label: 'Closure Evidence', value: item.closure_evidence },
                ] as { label: string; value: string | null }[]).map(({ label, value }) => value ? (
                  <div key={label}>
                    <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">{label}</p>
                    <p className="whitespace-pre-wrap text-xs leading-6 text-foreground/90">{value}</p>
                  </div>
                ) : null)}
                {item.resources_required && (
                  <div className="border-t border-border/40 pt-3">
                    <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">Resources Required</p>
                    <p className="text-xs leading-6 text-muted-foreground">{item.resources_required}</p>
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}

        {editingId === item.id && (
          <TableRow className="bg-card/20 hover:bg-card/20">
            <TableCell colSpan={8} className="p-4">
              <form onSubmit={handleEdit} className="space-y-3">
                <p className="command-kicker">Edit item</p>
                <PoamFormFields
                  form={editForm}
                  onChange={(patch) => setEditForm((prev) => ({ ...prev, ...patch }))}
                  isClosing={items.find(i => i.id === editingId)?.status !== 'Closed'}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" size="sm" variant="outline" className="h-8 border-border/80 bg-card/40 text-xs" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="h-8 text-xs" disabled={editSaving}>
                    {editSaving ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              </form>
            </TableCell>
          </TableRow>
        )}

        {isHistoryExpanded && renderHistoryPanel(item.id)}
      </React.Fragment>
    )
  }

  return (
    <>
      <section className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="space-y-4">
          <p className="command-kicker">Remediation command surface</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Plan of Action &amp; Milestones</h1>
          <p className="max-w-[44rem] text-sm leading-6 text-muted-foreground">
            Track remediation findings from identification through closure. Due dates, milestone progress, and status stay visible in one place.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="command-panel px-4 py-3">
              <div className="text-2xl font-semibold tabular-nums text-red-300">{summary.openCount}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Open</div>
            </div>
            <div className="command-panel px-4 py-3">
              <div className="text-2xl font-semibold tabular-nums text-amber-300">{summary.inProgressCount}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">In progress</div>
            </div>
            <div className="command-panel px-4 py-3">
              <div className="text-2xl font-semibold tabular-nums text-green-300">{summary.closedCount}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Closed</div>
            </div>
          </div>
        </div>

        <div className="command-panel p-4">
          <div className="flex items-center justify-between">
            <p className="command-kicker">Control view</p>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-border/80 bg-card/40 text-xs"
                onClick={() => setShowForm((v) => !v)}
              >
                {showForm ? 'Cancel' : 'Create item'}
              </Button>
            )}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="w-36">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 border-border/80 bg-card/40 text-xs">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <button
                onClick={toggleShowArchived}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {showArchived ? 'Hide archived' : 'Show archived'}
              </button>
            )}
          </div>
        </div>
      </section>

      {canEdit && showForm && (
        <form onSubmit={handleCreate} className="command-panel space-y-3 p-4">
          <p className="command-kicker">Create item</p>
          <PoamFormFields
            form={form}
            onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
            isClosing={false}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" className="h-8 text-xs" disabled={saving}>
              {saving ? 'Saving…' : 'Create item'}
            </Button>
          </div>
        </form>
      )}

      {saveError && (
        <div className="flex items-center justify-between border border-red-900/60 bg-red-950/20 px-4 py-2.5 text-xs text-red-300">
          <span>{saveError}</span>
          <button onClick={() => setSaveError(null)} className="ml-4 text-red-400 hover:text-red-200">×</button>
        </div>
      )}

      {filteredItems.length === 0 && (!showArchived || archivedItems.length === 0) ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {items.length === 0
            ? 'No POA&M items yet. Create the first item to start tracking remediation work.'
            : 'No items match the current filter.'}
        </div>
      ) : (
        <div className="command-table-shell">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Practice</TableHead>
                <TableHead>Gap Statement</TableHead>
                <TableHead className="w-36">Owner</TableHead>
                <TableHead className="w-28">Due Date</TableHead>
                <TableHead className="w-24">Progress</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-20">History</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => renderItemRow(item))}
              {showArchived && archivedLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="py-4 text-center text-xs text-muted-foreground">
                    Loading archived items…
                  </TableCell>
                </TableRow>
              )}
              {showArchived && !archivedLoading && archivedItems.length > 0 && (
                <>
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8} className="py-2">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/40">Archived</p>
                    </TableCell>
                  </TableRow>
                  {archivedItems.map((item) => renderItemRow(item, true))}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
