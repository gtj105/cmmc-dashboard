'use client'

import React, { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { PracticePicker } from '@/components/ui/practice-picker'
import type { PoamItem, PoamStatus } from '@/lib/types'
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
  canDelete: boolean
}

export function PoamTable({ initialItems, canEdit, canDelete }: PoamTableProps) {
  const [items, setItems] = useState<PoamItem[]>(initialItems)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<PoamFormState>(createEmptyPoamForm())
  const [editSaving, setEditSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

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
      finding: item.finding,
      practiceId: item.practice_id ?? '',
      owner: item.responsible_individual ?? '',
      resources: item.resources_required ?? '',
      date: item.scheduled_completion ? new Date(item.scheduled_completion).toISOString().slice(0, 10) : '',
    })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId || !editForm.finding.trim()) return
    setEditSaving(true)
    try {
      const res = await fetch(`/api/poam/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finding: editForm.finding,
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
      } else {
        showError('Failed to save changes.')
      }
    } catch {
      showError('Network error — changes were not saved.')
    }
    setEditSaving(false)
  }
  const [form, setForm] = useState<PoamFormState>(createEmptyPoamForm())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filteredItems = useMemo(() => filterPoamItems(items, statusFilter), [items, statusFilter])
  const summary = useMemo(() => buildPoamSummary(items), [items])

  const showError = useCallback((msg: string) => {
    setSaveError(msg)
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    dismissTimer.current = setTimeout(() => setSaveError(null), 5000)
  }, [])

  useEffect(() => () => { if (dismissTimer.current) clearTimeout(dismissTimer.current) }, [])

  async function handleStatusChange(id: number, newStatus: PoamStatus) {
    if (!canEdit) return
    const previous = items.find((i) => i.id === id)?.status
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)))
    try {
      const res = await fetch(`/api/poam/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: previous! } : item)))
        showError(res.status === 401 ? 'Session expired — please refresh.' : 'Failed to update status. Change reverted.')
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
      const res = await fetch(`/api/poam/${id}`, {
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
    if (!canEdit || !form.finding.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/poam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finding: form.finding,
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
        showError('Failed to create finding. Please try again.')
      }
    } catch {
      showError('Network error — finding was not saved.')
    }
    setSaving(false)
  }

  async function handleDelete(id: number) {
    if (!canDelete) return
    try {
      const res = await fetch(`/api/poam/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id))
      } else {
        showError(res.status === 401 ? 'Session expired — please refresh.' : 'Failed to delete item.')
      }
    } catch {
      showError('Network error — item was not deleted.')
    }
  }

  return (
    <>
      <section className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="space-y-4">
          <p className="command-kicker">Remediation command surface</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Plan of Action & Milestones</h1>
          <p className="max-w-[44rem] text-sm leading-6 text-muted-foreground">
            Customer-owned remediation work stays in scope here so the customer-owned backlog, due dates, and milestone movement stay visible without leaving the execution surface.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="command-panel px-4 py-3">
              <div className="text-2xl font-semibold tabular-nums text-red-300">{summary.openCount}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Customer-owned backlog</div>
            </div>
            <div className="command-panel px-4 py-3">
              <div className="text-2xl font-semibold tabular-nums text-amber-300">{summary.inProgressCount}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Active work</div>
            </div>
            <div className="command-panel px-4 py-3">
              <div className="text-2xl font-semibold tabular-nums text-green-300">{summary.closedCount}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Closed items</div>
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
                {showForm ? 'Cancel' : 'Create finding'}
              </Button>
            )}
          </div>
          <div className="mt-4 w-36">
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
        </div>
      </section>

      {canEdit && showForm && (
        <form onSubmit={handleCreate} className="command-panel space-y-3 p-4">
          <p className="command-kicker">Create finding</p>
          <textarea
            required
            placeholder="Finding description"
            value={form.finding}
            onChange={(e) => setForm((prev) => ({ ...prev, finding: e.target.value }))}
            className="w-full resize-y border border-border/70 bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            rows={18}
            maxLength={5000}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <PracticePicker
              value={form.practiceId}
              onChange={(v) => setForm((prev) => ({ ...prev, practiceId: v }))}
            />
            <input
              type="text"
              placeholder="Responsible individual"
              value={form.owner}
              maxLength={100}
              onChange={(e) => setForm((prev) => ({ ...prev, owner: e.target.value }))}
              className="border border-border/70 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Resources required"
              value={form.resources}
              maxLength={500}
              onChange={(e) => setForm((prev) => ({ ...prev, resources: e.target.value }))}
              className="border border-border/70 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <DatePicker
              value={form.date}
              onChange={(v) => setForm((prev) => ({ ...prev, date: v }))}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" className="h-8 text-xs" disabled={saving}>
              {saving ? 'Saving…' : 'Create finding'}
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

      {filteredItems.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {items.length === 0
            ? 'No POA&M items yet. Create the first finding to start tracking customer-owned remediation work.'
            : 'No items match the current filter.'}
        </div>
      ) : (
        <div className="command-table-shell">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Practice</TableHead>
                <TableHead>Finding</TableHead>
                <TableHead className="w-36">Owner</TableHead>
                <TableHead className="w-28">Due Date</TableHead>
                <TableHead className="w-24">Progress</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const isExpanded = expandedIds.has(item.id)
                return (
                <React.Fragment key={item.id}>
                <TableRow>
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
                        {item.finding.split('\n')[0]}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{item.responsible_individual ?? '—'}</span></TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{formatScheduledCompletion(item.scheduled_completion)}</span></TableCell>
                  <TableCell>
                    <Select
                      value={String(item.milestone_progress)}
                      onValueChange={(v) => handleProgressChange(item.id, parseInt(v, 10))}
                      disabled={!canEdit}
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
                      disabled={!canEdit}
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
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <button
                          onClick={() => editingId === item.id ? setEditingId(null) : startEdit(item)}
                          className="text-xs text-muted-foreground transition-colors hover:text-sky-300"
                          title="Edit"
                        >
                          ✎
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-xs text-muted-foreground transition-colors hover:text-red-300"
                          title="Delete"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                {isExpanded && editingId !== item.id && (
                  <TableRow className="bg-card/20 hover:bg-card/20">
                    <TableCell colSpan={7} className="px-6 py-4">
                      <div className="space-y-3 border-l-2 border-sky-500/20 pl-4">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">Finding detail</p>
                        <div className="space-y-2.5">
                          {item.finding.split('\n\n').map((para, i) => (
                            <p key={i} className="text-xs leading-6 text-foreground/90">{para}</p>
                          ))}
                        </div>
                        {item.resources_required && (
                          <div className="mt-3 border-t border-border/40 pt-3">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60 mb-1">Resources required</p>
                            <p className="text-xs leading-6 text-muted-foreground">{item.resources_required}</p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {editingId === item.id && (
                  <TableRow className="bg-card/20 hover:bg-card/20">
                    <TableCell colSpan={7} className="p-4">
                      <form onSubmit={handleEdit} className="space-y-3">
                        <p className="command-kicker">Edit finding</p>
                        <textarea
                          required
                          value={editForm.finding}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, finding: e.target.value }))}
                          className="w-full resize-y border border-border/70 bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          rows={6}
                          maxLength={5000}
                        />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <PracticePicker
                            value={editForm.practiceId}
                            onChange={(v) => setEditForm((prev) => ({ ...prev, practiceId: v }))}
                          />
                          <input
                            type="text"
                            placeholder="Responsible individual"
                            value={editForm.owner}
                            maxLength={100}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, owner: e.target.value }))}
                            className="border border-border/70 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <input
                            type="text"
                            placeholder="Resources required"
                            value={editForm.resources}
                            maxLength={500}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, resources: e.target.value }))}
                            className="border border-border/70 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <DatePicker
                            value={editForm.date}
                            onChange={(v) => setEditForm((prev) => ({ ...prev, date: v }))}
                          />
                        </div>
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
                </React.Fragment>
                )})}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
