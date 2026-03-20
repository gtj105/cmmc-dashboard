'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import type { ActivityEntry } from '@/lib/types'

const FIELD_LABELS: Record<string, string> = {
  status: 'status',
  evidence_exists: 'evidence',
  owner: 'owner',
  due_date: 'due date',
  notes: 'notes',
  risk_level: 'risk level',
}

const STATUS_COLORS: Record<string, string> = {
  'Not Started': 'text-zinc-400',
  'In Progress': 'text-amber-400',
  'Implemented': 'text-blue-400',
  'Audit Ready': 'text-green-400',
}

interface ActivityEntryWithDomain extends ActivityEntry {
  domain_abbr: string | null
}

function formatValue(field: string, value: string | null): string {
  if (value === null || value === '') return 'none'
  if (field === 'evidence_exists') return value === 'true' ? 'yes' : 'no'
  if (field === 'due_date') {
    try {
      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch { return value }
  }
  return value
}

function formatDate(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function ActivityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<ActivityEntryWithDomain[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/activity')
      .then((r) => r.json())
      .then((data) => { setEntries(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status])

  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? 'My Organization'

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
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {orgName}
          </span>
        </div>

        <div className="py-4 border-b border-border">
          <div className="text-5xl font-bold leading-none tracking-tight tabular-nums text-foreground">
            {entries.length}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-widest font-medium">
            Activity Log — Recent Changes
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No activity yet — changes to practices will appear here.
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-border">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-4 py-3 group hover:bg-accent/30 px-2 rounded-md transition-colors">
                <div className="w-28 shrink-0 text-right">
                  <span className="text-[11px] font-mono text-muted-foreground">{formatDate(entry.changed_at)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">{entry.changed_by}</span>
                  <span className="text-xs text-muted-foreground mx-1.5">changed</span>
                  <span className="text-xs text-muted-foreground font-medium">{FIELD_LABELS[entry.field_changed] ?? entry.field_changed}</span>
                  <span className="text-xs text-muted-foreground mx-1.5">on</span>
                  <span className="font-mono text-xs text-foreground">
                    {entry.practice_id}
                  </span>
                  {entry.domain_abbr && (
                    <span className="ml-1.5 text-[10px] font-mono text-muted-foreground">[{entry.domain_abbr}]</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {entry.old_value !== null && (
                    <>
                      <span className={`text-xs ${STATUS_COLORS[entry.old_value] ?? 'text-muted-foreground'} line-through`}>
                        {formatValue(entry.field_changed, entry.old_value)}
                      </span>
                      <span className="text-muted-foreground text-xs">→</span>
                    </>
                  )}
                  <span className={`text-xs font-medium ${STATUS_COLORS[entry.new_value ?? ''] ?? 'text-foreground'}`}>
                    {formatValue(entry.field_changed, entry.new_value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
