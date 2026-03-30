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
    data.sprsScore >= 88 ? '#4ade80' : data.sprsScore >= 50 ? '#fb923c' : '#f87171'

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
        .section-header {
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: hsl(var(--foreground) / 0.5);
          padding-bottom: 0.5rem;
          border-bottom: 1px solid hsl(var(--border) / 0.6);
          margin-bottom: 1rem;
        }
      `}</style>

      <main className="mx-auto max-w-5xl px-8 py-10 font-sans text-foreground">

        {/* Print button — hidden in print */}
        <div className="mb-8 flex items-center justify-between print-hide">
          <a href="/overview" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to Overview
          </a>
          <PrintButton />
        </div>

        {/* Section 1: Masthead */}
        <div className="mb-12 border-b border-border pb-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-foreground/40">
            {orgName}
          </p>
          <h1 className="mt-2 text-[1.375rem] font-semibold tracking-tight text-foreground">
            CMMC Level 2 Assessment Report
          </h1>
          <div className="mt-3 flex gap-6 text-xs text-foreground/50">
            <span>Report Date: {data.reportDate}</span>
            <span>Last Assessment: {formatAssessmentDate(data.lastAssessmentDate)}</span>
          </div>
        </div>

        {/* Section 2: SPRS Score */}
        <div className="mb-12 print-avoid-break">
          <h2 className="section-header">SPRS Score</h2>
          <div className="grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-4">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-foreground/40">Score</div>
              <div
                className="mt-1 text-3xl font-semibold tabular-nums leading-none"
                style={{ color: sprsColor }}
              >
                {data.sprsScore}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-foreground/40">Range</div>
              <div className="mt-1 text-sm text-foreground/70 tabular-nums">−203 → 110</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-foreground/40">Practices Implemented</div>
              <div className="mt-1 text-sm text-foreground/70 tabular-nums">
                {data.implementedCount} of {data.totalPractices}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-foreground/40">Reported Via</div>
              <div className="mt-1 text-sm text-foreground/70">SPRS</div>
            </div>
          </div>
        </div>

        {/* Section 3: Domain Completion */}
        <div className="mb-12 print-break-before">
          <h2 className="section-header">Domain Completion</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-left text-foreground/40">
                <th className="py-2 pr-4 font-medium">Domain</th>
                <th className="py-2 pr-4 font-medium text-right">Practices</th>
                <th className="py-2 pr-4 font-medium text-right">Complete</th>
                <th className="py-2 font-medium">Progress</th>
              </tr>
            </thead>
            <tbody>
              {data.domainsWithPct.map((d) => {
                const barColor =
                  d.completion_pct >= 80
                    ? '#4ade80'
                    : d.completion_pct >= 40
                    ? '#fb923c'
                    : '#f87171'
                return (
                  <tr key={d.id} className="print-avoid-break border-b border-border/30">
                    <td className="py-2 pr-4">
                      <span className="font-mono text-amber-200/70">{d.abbreviation}</span>
                      <span className="ml-2 text-foreground/60">{d.name}</span>
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-foreground/70">{d.total}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-foreground/70">{d.osc_complete}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-1 w-24 overflow-hidden rounded-full bg-border/60">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${d.completion_pct}%`, backgroundColor: barColor }}
                          />
                        </div>
                        <span className="tabular-nums text-foreground/60">{d.completion_pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Section 4: Evidence Gap */}
        <div className="mb-12 print-avoid-break">
          <h2 className="section-header">Evidence Gap</h2>
          <div className="flex items-baseline gap-2.5">
            <span
              className={`text-2xl font-semibold tabular-nums ${
                data.evidenceGap === 0 ? 'text-green-400' : 'text-amber-400'
              }`}
            >
              {data.evidenceGap}
            </span>
            <span className="text-sm text-foreground/60">practices missing evidence</span>
          </div>
          <p className="mt-2 text-xs text-foreground/50">
            Practices marked Implemented or Audit Ready with no attached evidence files or links.
            These pass the internal score but will fail a C3PAO audit.
          </p>
        </div>

        {/* Section 5: Open POA&M Items */}
        <div className="mb-12 print-break-before">
          <h2 className="section-header">Open POA&amp;M Items</h2>
          {data.openPoamItems.length === 0 ? (
            <p className="text-xs text-foreground/50">No open POA&amp;M items.</p>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-left text-foreground/40">
                  <th className="py-2 pr-4 font-medium">Finding</th>
                  <th className="py-2 pr-4 font-medium">Practice</th>
                  <th className="py-2 pr-4 font-medium">Responsible</th>
                  <th className="py-2 pr-4 font-medium">Due Date</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.openPoamItems.map((item) => (
                  <tr key={item.id} className="print-avoid-break border-b border-border/30">
                    <td className="py-2 pr-4 text-foreground/80">{item.gap_statement}</td>
                    <td className="py-2 pr-4 font-mono text-amber-200/70">{item.practice_id ?? '—'}</td>
                    <td className="py-2 pr-4 text-foreground/60">{item.responsible_individual ?? '—'}</td>
                    <td className="py-2 pr-4 text-foreground/60">
                      {formatScheduledCompletion(item.scheduled_completion)}
                    </td>
                    <td className="py-2">
                      <span
                        className={
                          item.status === 'Open'
                            ? 'text-red-400'
                            : item.status === 'In Progress'
                            ? 'text-amber-400'
                            : 'text-foreground/50'
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
        <div className="mb-12">
          <h2 className="section-header">Recent Activity</h2>
          {data.recentActivity.length === 0 ? (
            <p className="text-xs text-foreground/50">No recent activity.</p>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-left text-foreground/40">
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
                  <tr key={entry.id} className="print-avoid-break border-b border-border/30">
                    <td className="py-2 pr-4 text-foreground/50">
                      {new Date(entry.changed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-2 pr-4 font-mono text-amber-200/70">{entry.practice_id}</td>
                    <td className="py-2 pr-4 text-foreground/50">{entry.domain_abbr ?? '—'}</td>
                    <td className="py-2 pr-4 text-foreground/50">
                      {FIELD_LABELS[entry.field_changed] ?? entry.field_changed}
                    </td>
                    <td className="py-2 pr-4">
                      <span className="text-foreground/40 line-through">
                        {formatActivityValue(entry.field_changed, entry.old_value)}
                      </span>
                      <span className="mx-1.5 text-foreground/30">→</span>
                      <span className="text-foreground/80">
                        {formatActivityValue(entry.field_changed, entry.new_value)}
                      </span>
                    </td>
                    <td className="py-2 text-foreground/50">{entry.changed_by}</td>
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
