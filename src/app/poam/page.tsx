'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { PoamItem, PoamStatus } from '@/lib/types'

const STATUS_COLORS: Record<PoamStatus, string> = {
  'Open': 'text-red-400 bg-red-950/40 border-red-800/50',
  'In Progress': 'text-amber-400 bg-amber-950/40 border-amber-800/50',
  'Closed': 'text-green-400 bg-green-950/40 border-green-800/50',
}

const STATUSES: PoamStatus[] = ['Open', 'In Progress', 'Closed']

export default function PoamPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<PoamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [newFinding, setNewFinding] = useState('')
  const [newPracticeId, setNewPracticeId] = useState('')
  const [newOwner, setNewOwner] = useState('')
  const [newResources, setNewResources] = useState('')
  const [newDate, setNewDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/poam')
      .then((r) => r.json())
      .then((data) => { setItems(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status])

  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? 'My Organization'

  const filtered = items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    return true
  })

  async function handleStatusChange(id: number, newStatus: PoamStatus) {
    const res = await fetch(`/api/poam/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const updated = await res.json()
      setItems((prev) => prev.map((item) => item.id === id ? updated : item))
    }
  }

  async function handleProgressChange(id: number, progress: number) {
    const res = await fetch(`/api/poam/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestone_progress: progress }),
    })
    if (res.ok) {
      const updated = await res.json()
      setItems((prev) => prev.map((item) => item.id === id ? updated : item))
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newFinding.trim()) return
    setSaving(true)
    const res = await fetch('/api/poam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        finding: newFinding,
        practice_id: newPracticeId || null,
        responsible_individual: newOwner || null,
        resources_required: newResources || null,
        scheduled_completion: newDate || null,
      }),
    })
    if (res.ok) {
      const created = await res.json()
      setItems((prev) => [created, ...prev])
      setNewFinding('')
      setNewPracticeId('')
      setNewOwner('')
      setNewResources('')
      setNewDate('')
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/poam/${id}`, { method: 'DELETE' })
    if (res.ok) setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const openCount = items.filter((i) => i.status === 'Open').length
  const inProgressCount = items.filter((i) => i.status === 'In Progress').length
  const closedCount = items.filter((i) => i.status === 'Closed').length

  if (status === 'loading' || loading) {
    return (
      <AppShell orgName={orgName}>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </AppShell>
    )
  }

  return (
    <AppShell orgName={orgName}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {orgName}
          </span>
        </div>

        {/* Title + KPIs */}
        <div className="py-4 border-b border-border">
          <div className="flex items-end gap-10">
            <div>
              <div className="text-5xl font-bold leading-none tracking-tight tabular-nums text-foreground">
                {items.length}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-widest font-medium">
                Plan of Action & Milestones
              </p>
            </div>
          </div>
          <div className="flex gap-0 mt-6 divide-x divide-border">
            {[
              { label: 'Open', value: openCount, color: 'text-red-400' },
              { label: 'In Progress', value: inProgressCount, color: 'text-amber-400' },
              { label: 'Closed', value: closedCount, color: 'text-green-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex-1 px-5">
                <div className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-36 text-xs">
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
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'Cancel' : '+ Add Item'}
          </Button>
        </div>

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleCreate} className="border border-border rounded-lg p-4 space-y-3 bg-card">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">New POA&amp;M Item</p>
            <div className="space-y-2">
              <textarea
                required
                placeholder="Finding description (required)"
                value={newFinding}
                onChange={(e) => setNewFinding(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Practice ID (e.g. AC.L2-3.1.1)"
                  value={newPracticeId}
                  onChange={(e) => setNewPracticeId(e.target.value)}
                  className="bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
                <input
                  type="text"
                  placeholder="Responsible individual"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="Resources required"
                  value={newResources}
                  onChange={(e) => setNewResources(e.target.value)}
                  className="bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" className="h-8 text-xs" disabled={saving}>
                {saving ? 'Saving…' : 'Add Item'}
              </Button>
            </div>
          </form>
        )}

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {items.length === 0
              ? 'No POA&M items yet — add your first finding above.'
              : 'No items match the current filter.'}
          </div>
        ) : (
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
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {item.practice_id ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-foreground">{item.finding}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{item.responsible_individual ?? '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground font-mono">
                      {item.scheduled_completion
                        ? new Date(item.scheduled_completion).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={String(item.milestone_progress)}
                      onValueChange={(v) => handleProgressChange(item.id, parseInt(v))}
                    >
                      <SelectTrigger className="h-7 w-20 text-xs">
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
                    >
                      <SelectTrigger className={`h-7 w-28 text-xs border rounded px-2 ${STATUS_COLORS[item.status]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-muted-foreground hover:text-red-400 text-xs transition-colors"
                      title="Delete"
                    >
                      ×
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AppShell>
  )
}
