import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import sql from '@/lib/db'
import AppShell from '@/components/layout/AppShell'
import type { ActivityEntry } from '@/lib/types'

export const dynamic = 'force-dynamic'

const FIELD_LABELS: Record<string, string> = {
  status: 'status',
  evidence_exists: 'evidence',
  owner: 'owner',
  due_date: 'due date',
  notes: 'notes',
  risk_level: 'risk level',
}

const STATUS_COLORS: Record<string, string> = {
  'Not Started': 'text-zinc-300',
  'In Progress': 'text-amber-300',
  'Implemented': 'text-stone-200',
  'Audit Ready': 'text-green-300',
}

function getEntryBorderClass(field: string, newValue: string | null): string {
  if (field === 'status') {
    const v = newValue ?? ''
    if (v === 'Audit Ready') return 'border-l-2 border-l-green-700/60'
    if (v === 'Implemented') return 'border-l-2 border-l-blue-700/60'
    if (v === 'In Progress') return 'border-l-2 border-l-amber-700/60'
    return 'border-l-2 border-l-zinc-700/40'
  }
  if (field === 'evidence_exists') return 'border-l-2 border-l-amber-600/50'
  if (field === 'risk_level') return 'border-l-2 border-l-red-800/50'
  return 'border-l-2 border-l-border'
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
    } catch {
      return value
    }
  }
  return value
}

function formatDate(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default async function ActivityPage() {
  const session = await getServerSession(getAuthOptions())
  if (!session) redirect('/login')

  const orgName = process.env.ORG_NAME ?? 'My Organization'

  const entries = await sql<ActivityEntryWithDomain[]>`
    SELECT h.*, d.abbreviation AS domain_abbr
    FROM practice_history h
    LEFT JOIN practices p ON p.practice_id = h.practice_id
    LEFT JOIN domains d ON d.id = p.domain_id
    ORDER BY h.changed_at DESC
    LIMIT 200
  `

  const recentStatusChanges = entries.filter((e) => e.field_changed === 'status').length
  const recentEvidenceChanges = entries.filter((e) => e.field_changed === 'evidence_exists').length

  return (
    <AppShell orgName={orgName}>
      <div className="space-y-8">
        <section className="border-b border-border pb-8">
          <div className="space-y-4">
            <p className="command-kicker">High-signal activity</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Recent changes that matter</h1>
            <p className="max-w-[44rem] text-sm leading-6 text-muted-foreground">
              Review the highest-signal operational changes first, then scan the full event stream below.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="command-panel px-4 py-3">
                <div className="text-2xl font-semibold tabular-nums text-foreground">{entries.length}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Events in view</div>
              </div>
              <div className="command-panel px-4 py-3">
                <div className="text-2xl font-semibold tabular-nums text-amber-300">{recentStatusChanges}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Status changes</div>
              </div>
              <div className="command-panel px-4 py-3">
                <div className="text-2xl font-semibold tabular-nums text-green-300">{recentEvidenceChanges}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Evidence updates</div>
              </div>
            </div>
          </div>
        </section>

        {entries.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No activity yet. Changes to practices and remediation items will appear here.
          </div>
        ) : (
          <div className="command-table-shell divide-y divide-border">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`grid gap-3 px-4 py-4 lg:grid-cols-[160px_minmax(0,1fr)_220px] lg:items-start ${getEntryBorderClass(entry.field_changed, entry.new_value)}`}
              >
                <div className="text-[11px] text-muted-foreground">{formatDate(entry.changed_at)}</div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="text-muted-foreground">{entry.changed_by}</span>{' '}
                    changed <span className="text-muted-foreground">{FIELD_LABELS[entry.field_changed] ?? entry.field_changed}</span>{' '}
                    on <span className="font-mono">{entry.practice_id}</span>
                    {entry.domain_abbr && <span className="ml-2 text-[11px] text-muted-foreground">[{entry.domain_abbr}]</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 lg:justify-end">
                  {entry.old_value !== null && (
                    <>
                      <span className={`text-xs line-through ${STATUS_COLORS[entry.old_value] ?? 'text-muted-foreground'}`}>
                        {formatValue(entry.field_changed, entry.old_value)}
                      </span>
                      <span className="text-xs text-muted-foreground">→</span>
                    </>
                  )}
                  <span className={`text-xs font-semibold ${STATUS_COLORS[entry.new_value ?? ''] ?? 'text-foreground'}`}>
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
