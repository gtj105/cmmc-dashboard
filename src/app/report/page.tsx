import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { fetchReportData } from './report-data'
import { formatAssessmentDate } from '@/app/overview/overview-data'
import { formatScheduledCompletion } from '@/app/poam/poam-page-data'
import { PrintButton } from './PrintButton'
import { getOrgName } from '@/lib/settings'

export const dynamic = 'force-dynamic'

const FIELD_LABELS: Record<string, string> = {
  status: 'Status',
  risk_level: 'Risk Level',
  evidence_exists: 'Evidence',
  owner: 'Owner',
  due_date: 'Due Date',
  notes: 'Notes',
}

function formatActivityValue(field: string, value: string | null): string {
  if (!value) return '—'
  if (field === 'evidence_exists') return value === 'true' ? 'Yes' : 'No'
  if (field === 'due_date') {
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  return value
}

export default async function ReportPage() {
  const session = await getServerSession(getAuthOptions())
  if (!session) redirect('/login')

  const data = await fetchReportData()
  const orgName = await getOrgName()

  const sprsColor =
    data.sprsScore >= 88 ? '#16a34a' : data.sprsScore >= 50 ? '#d97706' : '#dc2626'

  return (
    <>
      <style>{`
        @media print {
          * { color: #000 !important; background: #fff !important; border-color: #ccc !important; }
          @page { margin: 0.75in; size: letter portrait; }
          .print-break-before { page-break-before: always; }
          .print-avoid-break  { page-break-inside: avoid; }
          .print-hide         { display: none !important; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 4px 8px; font-size: 10pt; }
          th { background: #f0f0f0 !important; font-weight: 600; }
        }
      `}</style>

      <main className="mx-auto max-w-5xl px-8 py-10 font-sans text-foreground">

        {/* Print button — hidden in print */}
        <div className="mb-6 flex items-center justify-between print-hide">
          <a href="/overview" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to Overview
          </a>
          <PrintButton />
        </div>

        {/* Section 1: Header */}
        <div className="mb-10 border-b border-border pb-6">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {orgName}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">
            CMMC Level 2 Assessment Report
          </h1>
          <div className="mt-2 flex gap-6 text-xs text-muted-foreground">
            <span>Report Date: {data.reportDate}</span>
            <span>Last Assessment: {formatAssessmentDate(data.lastAssessmentDate)}</span>
          </div>
        </div>

        {/* Section 2: SPRS Score */}
        <div className="mb-10 print-avoid-break">
          <h2 className="mb-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            SPRS Score
          </h2>
          <div className="flex items-end gap-4">
            <span
              className="text-6xl font-semibold tabular-nums leading-none"
              style={{ color: sprsColor }}
            >
              {data.sprsScore}
            </span>
            <div className="mb-1 text-xs text-muted-foreground">
              <div>out of 110</div>
              <div>{data.implementedCount} of {data.totalPractices} practices implemented</div>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Score range −203 → 110. Reported to DoD via Supplier Performance Risk System (SPRS).
          </p>
        </div>

        {/* Section 3: Domain Completion */}
        <div className="mb-10 print-break-before">
          <h2 className="mb-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Domain Completion
          </h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Domain</th>
                <th className="py-2 pr-4 font-medium text-right">Practices</th>
                <th className="py-2 pr-4 font-medium text-right">Complete</th>
                <th className="py-2 pr-4 font-medium text-right">% Complete</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.domainsWithPct.map((d) => {
                const statusLabel =
                  d.completion_pct >= 80
                    ? 'On Track'
                    : d.completion_pct >= 40
                    ? 'At Risk'
                    : 'Not Started'
                const statusColor =
                  d.completion_pct >= 80
                    ? 'text-green-400'
                    : d.completion_pct >= 40
                    ? 'text-amber-400'
                    : 'text-red-400'
                return (
                  <tr key={d.id} className="print-avoid-break border-b border-border/40">
                    <td className="py-2 pr-4">
                      <span className="font-mono text-sky-300">{d.abbreviation}</span>
                      <span className="ml-2 text-muted-foreground">{d.name}</span>
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">{d.total}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{d.osc_complete}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{d.completion_pct}%</td>
                    <td className={`py-2 text-xs ${statusColor}`}>{statusLabel}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Section 4: Evidence Gap */}
        <div className="mb-10 print-avoid-break">
          <h2 className="mb-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Evidence Gap
          </h2>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-4xl font-semibold tabular-nums ${
                data.evidenceGap === 0 ? 'text-green-400' : 'text-amber-400'
              }`}
            >
              {data.evidenceGap}
            </span>
            <span className="text-sm text-muted-foreground">practices missing evidence</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Practices marked Implemented or Audit Ready with no attached evidence files or links.
            These pass the internal score but will fail a C3PAO audit.
          </p>
        </div>

        {/* Section 5: Open POA&M Items */}
        <div className="mb-10 print-break-before">
          <h2 className="mb-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Open POA&amp;M Items
          </h2>
          {data.openPoamItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">No open POA&amp;M items.</p>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-2 font-medium">#</th>
                  <th className="py-2 pr-4 font-medium">Finding</th>
                  <th className="py-2 pr-4 font-medium">Practice</th>
                  <th className="py-2 pr-4 font-medium">Responsible</th>
                  <th className="py-2 pr-4 font-medium">Due Date</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.openPoamItems.map((item, i) => (
                  <tr key={item.id} className="print-avoid-break border-b border-border/40">
                    <td className="py-2 pr-2 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 pr-4 text-foreground">{item.finding}</td>
                    <td className="py-2 pr-4 font-mono text-sky-300">{item.practice_id ?? '—'}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{item.responsible_individual ?? '—'}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {formatScheduledCompletion(item.scheduled_completion)}
                    </td>
                    <td className="py-2">
                      <span
                        className={
                          item.status === 'Open'
                            ? 'text-red-400'
                            : item.status === 'In Progress'
                            ? 'text-amber-400'
                            : 'text-muted-foreground'
                        }
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Section 6: Recent Activity */}
        <div className="mb-10">
          <h2 className="mb-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Recent Activity
          </h2>
          {data.recentActivity.length === 0 ? (
            <p className="text-xs text-muted-foreground">No recent activity.</p>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Practice</th>
                  <th className="py-2 pr-4 font-medium">Domain</th>
                  <th className="py-2 pr-4 font-medium">Field</th>
                  <th className="py-2 pr-4 font-medium">Change</th>
                  <th className="py-2 font-medium">By</th>
                </tr>
              </thead>
              <tbody>
                {data.recentActivity.map((entry) => (
                  <tr key={entry.id} className="print-avoid-break border-b border-border/40">
                    <td className="py-2 pr-4 text-muted-foreground">
                      {new Date(entry.changed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-2 pr-4 font-mono text-sky-300">{entry.practice_id}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{entry.domain_abbr ?? '—'}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {FIELD_LABELS[entry.field_changed] ?? entry.field_changed}
                    </td>
                    <td className="py-2 pr-4">
                      <span className="text-muted-foreground line-through">
                        {formatActivityValue(entry.field_changed, entry.old_value)}
                      </span>
                      <span className="mx-1 text-muted-foreground">→</span>
                      <span className="text-foreground">
                        {formatActivityValue(entry.field_changed, entry.new_value)}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground">{entry.changed_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </>
  )
}
