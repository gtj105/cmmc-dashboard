import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import AppShell from '@/components/layout/AppShell'
import OverviewCharts from './OverviewCharts'
import AnimatedProgress from '@/components/AnimatedProgress'
import ComplianceGauge from '@/components/ComplianceGauge'
import {
  computeItarScorePct,
  fetchOverviewData,
  formatAssessmentDate,
  ragBorderClass,
  ragPanelClass,
  ragTextClass,
  riskColorMap,
} from './overview-data'

export const dynamic = 'force-dynamic'

export default async function OverviewPage() {
  const session = await getServerSession(getAuthOptions())
  if (!session) redirect('/login')

  const orgName = process.env.ORG_NAME ?? 'My Organization'
  const {
    burndown,
    criticalPractices,
    domainsWithPct,
    evidenceGap,
    hasActiveOverlay,
    metrics,
    ownershipBreakdown,
    stats,
    statusBreakdown,
    weakestDomain,
  } = await fetchOverviewData()

  const {
    coverageTotals,
    sprsScore,
    baselineSprsScore,
  } = metrics

  const itarScorePct = computeItarScorePct(stats.itar_total, stats.itar_implemented)
  const lastAssessmentDate = formatAssessmentDate(stats.last_assessment_date)
  const primaryScorePct = coverageTotals.score_pct
  const riskColors = riskColorMap()

  // domainsWithPct is already sorted worst-first (lowest completion_pct first)
  const domainTiles = domainsWithPct

  const statusCards = [
    { label: 'Not Started', value: statusBreakdown.not_started, tone: 'text-red-300',     bg: 'border-red-900/50 bg-red-950/15' },
    { label: 'In Progress',  value: statusBreakdown.in_progress,  tone: 'text-amber-300', bg: 'border-amber-900/40 bg-amber-950/10' },
    { label: 'Implemented',  value: statusBreakdown.implemented,  tone: 'text-foreground', bg: 'border-border/80 bg-card/40' },
    { label: 'Audit Ready',  value: statusBreakdown.audit_ready,  tone: 'text-green-300', bg: 'border-emerald-900/40 bg-emerald-950/10' },
  ]

  return (
    <AppShell orgName={orgName}>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {orgName}
          </span>
          <span className="text-[11px] text-muted-foreground">Updated {lastAssessmentDate}</span>
        </div>

        {/* Section 1 — Command Surface */}
        <section className="border-b border-border pb-8">
          <p className="command-kicker mb-5">Compliance command surface</p>

          <div className={hasActiveOverlay && ownershipBreakdown
            ? 'grid gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,1fr)_156px]'
            : 'space-y-4'
          }>
            {/* Left: headline numbers + status cards in one row, progress below */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                {/* Gauge */}
                <ComplianceGauge
                  cmmc={primaryScorePct}
                  sprs={sprsScore}
                  baselineSprs={baselineSprsScore}
                  hasBaseline={hasActiveOverlay}
                />

                {/* Status cards — fill remaining horizontal space */}
                <div className="grid grid-cols-2 gap-2 flex-1 min-w-[240px]">
                  {statusCards.map(({ label, value, tone, bg }) => (
                    <div key={label} className={`border px-4 py-3 ${bg}`}>
                      <div className={`text-2xl font-semibold tabular-nums ${tone}`}>{value}</div>
                      <div className="command-kicker mt-1">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <AnimatedProgress value={primaryScorePct} className="h-1.5" delay={400} />
            </div>

            {/* Right: ownership — contextual, only with active overlay */}
            {hasActiveOverlay && ownershipBreakdown && (
              <div className="border-l border-border pl-6 pt-1">
                <p className="command-kicker mb-3">Ownership</p>
                <div className="space-y-3">
                  {[
                    { label: 'CSP',    value: ownershipBreakdown.csp,    color: 'border-l-sky-400    text-sky-300' },
                    { label: 'Shared', value: ownershipBreakdown.shared, color: 'border-l-amber-400   text-amber-300' },
                    { label: 'OSC',    value: ownershipBreakdown.osc,    color: 'border-l-emerald-500 text-emerald-300' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`border-l-2 pl-3 ${color}`}>
                      <span className="text-xl font-semibold tabular-nums">{value}</span>
                      <span className="command-kicker ml-1.5">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 2 — Immediate Attention + ITAR */}
        <section className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">Immediate Attention</h2>
              <a href="/risk" className="text-xs text-muted-foreground hover:text-foreground">
                Open risk tracker →
              </a>
            </div>

            {evidenceGap > 0 && (
              <div className="border border-amber-950/80 bg-amber-950/10 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300/80">Evidence exposure</p>
                    <p className="mt-2 max-w-[34ch] text-sm leading-6 text-amber-100/85">
                      {evidenceGap === 1
                        ? 'One completed control lacks evidence.'
                        : `${evidenceGap} completed controls lack evidence.`}{' '}
                      These controls can still fail a C3PAO assessment.
                    </p>
                  </div>
                  <div className="text-4xl font-semibold tabular-nums text-amber-300">{evidenceGap}</div>
                </div>
              </div>
            )}

            <div className="command-panel">
              <div className="border-b border-border px-4 py-3">
                <p className="command-kicker">Top blockers</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Critical and high-risk customer-owned controls still untouched.
                </p>
              </div>
              <div className="divide-y divide-border">
                {criticalPractices.length > 0 ? criticalPractices.map((practice) => (
                  <a
                    key={practice.practice_id}
                    href={`/domain/${practice.domain_id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
                  >
                    <span className="w-16 shrink-0 text-xs text-muted-foreground">{practice.practice_id}</span>
                    <span className={`shrink-0 border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${riskColors[practice.risk_level]}`}>
                      {practice.risk_level}
                    </span>
                    <span className="w-8 shrink-0 text-xs text-muted-foreground">{practice.domain_abbr}</span>
                    <span className="flex-1 text-sm text-foreground">{practice.title}</span>
                  </a>
                )) : (
                  <div className="px-4 py-6 text-sm text-muted-foreground">
                    All critical controls have been started.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Most exposed */}
            {weakestDomain && (
              <div className={`border p-4 ${ragPanelClass(weakestDomain.completion_pct)}`}>
                <p className="command-kicker">Most exposed domain</p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold tracking-tight text-foreground">
                      {weakestDomain.abbreviation} · {weakestDomain.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {weakestDomain.not_started} not started · {weakestDomain.in_progress} in progress
                    </p>
                  </div>
                  <p className={`text-3xl font-semibold tabular-nums ${ragTextClass(weakestDomain.completion_pct)}`}>
                    {weakestDomain.completion_pct}%
                  </p>
                </div>
              </div>
            )}

            {/* ITAR Overlay */}
            <div className="border border-amber-950/80 bg-amber-950/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300/80">ITAR Overlay</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className={`text-3xl font-semibold ${ragTextClass(itarScorePct)}`}>{itarScorePct}%</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stats.itar_implemented} of {stats.itar_total} overlay controls implemented
                  </p>
                </div>
                <a href="/itar" className="text-xs text-amber-200/80 hover:text-amber-100">
                  View overlay →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 — Domain tiles */}
        <section className="space-y-4 border-b border-border pb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">Weakest Domains</h2>
            <span className="text-xs text-muted-foreground">14 domains — sorted by completion rate</span>
          </div>
          <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
            {domainTiles.map((domain) => (
              <a
                key={domain.id}
                href={`/domain/${domain.id}`}
                className={`group border px-3 py-2.5 transition-all duration-150 hover:-translate-y-px hover:bg-accent/40 ${
                  domain.completion_pct === 100
                    ? 'border-emerald-700/50 ring-1 ring-emerald-500/20'
                    : ragBorderClass(domain.completion_pct)
                }`}
              >
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-sm font-semibold text-sky-500/80 transition-colors duration-150 group-hover:text-sky-400">
                    {domain.abbreviation}
                  </span>
                  <span className={`text-sm font-semibold tabular-nums ${ragTextClass(domain.completion_pct)}`}>
                    {domain.completion_pct}%
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {domain.name}
                </p>
                <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-border/60">
                  <div
                    className={`h-full ${domain.completion_pct >= 80 ? 'bg-emerald-500/60' : domain.completion_pct >= 40 ? 'bg-amber-500/60' : 'bg-red-500/60'}`}
                    style={{ width: `${domain.completion_pct}%` }}
                  />
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Section 4 — Program Trend */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">Program Trend</h2>
          <OverviewCharts
            initialBurndown={burndown as unknown as Array<{ week: string; open: number; closed: number }>}
            domains={domainsWithPct}
          />
        </section>

      </div>
    </AppShell>
  )
}
