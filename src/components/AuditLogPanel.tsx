'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'

interface AuditEvent {
  id: number
  action: string
  actor: string | null
  target: string | null
  ip_address: string | null
  details: string | null
  created_at: string
}

const ACTION_COLORS: Record<string, string> = {
  'login.success': 'text-green-400',
  'login.failed': 'text-red-400',
  'login.locked_out': 'text-red-500',
  'user.created': 'text-sky-400',
  'user.role_changed': 'text-amber-400',
  'user.deleted': 'text-red-400',
  'backup.exported': 'text-sky-400',
  'backup.imported': 'text-amber-400',
  'password.changed': 'text-green-400',
  'evidence.uploaded': 'text-sky-400',
  'evidence.deleted': 'text-red-400',
  'overlay.toggled': 'text-amber-400',
  'csrf.rejected': 'text-red-500',
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function actionColor(action: string): string {
  return ACTION_COLORS[action] ?? 'text-muted-foreground'
}

export default function AuditLogPanel() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterAction, setFilterAction] = useState('')
  const [filterActor, setFilterActor] = useState('')
  const [limit, setLimit] = useState(50)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('limit', String(limit))
      if (filterAction) params.set('action', filterAction)
      if (filterActor) params.set('actor', filterActor)

      const res = await apiFetch(`/api/admin/audit?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load audit events')
      const data = await res.json()
      setEvents(data.events ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [limit, filterAction, filterActor])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const uniqueActions = [...new Set(events.map((e) => e.action))].sort()

  const inputCls =
    'border border-border/70 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Security events recorded by the audit system. Login attempts, user changes, backup operations, and more.
        </p>
        <button
          onClick={fetchEvents}
          disabled={loading}
          className="border border-border/80 bg-card/40 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-[11px] text-muted-foreground">Action</label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className={inputCls}
          >
            <option value="">All actions</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-muted-foreground">Actor</label>
          <input
            type="text"
            placeholder="Email..."
            value={filterActor}
            onChange={(e) => setFilterActor(e.target.value)}
            className={inputCls + ' w-48'}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-muted-foreground">Limit</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className={inputCls}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
          </select>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Event table */}
      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card/60">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Actor
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Target
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                IP
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {events.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">
                  No security events found.
                </td>
              </tr>
            )}
            {events.map((evt) => (
              <tr key={evt.id} className="bg-card/20 transition-colors hover:bg-card/40">
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimestamp(evt.created_at)}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-mono font-medium ${actionColor(evt.action)}`}>
                    {evt.action}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">
                  {evt.actor ?? '—'}
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{evt.target ?? '—'}</td>
                <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground/60">
                  {evt.ip_address ?? '—'}
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">
                  {evt.details ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Showing {events.length} event{events.length !== 1 ? 's' : ''}. Events are stored in the
        security_events table and also written to structured logs (stdout).
      </p>
    </div>
  )
}
