import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sql from '@/lib/db'
import AppShell from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import OverviewCharts from './OverviewCharts'
import type { RiskLevel } from '@/lib/types'
import AnimatedNumber from '@/components/AnimatedNumber'
import AnimatedProgress from '@/components/AnimatedProgress'

export default async function OverviewPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const orgName = process.env.ORG_NAME ?? 'My Organization'

  // Fetch overview stats
  const [stats] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE framework = 'CMMC')::int AS total,
      COUNT(*) FILTER (WHERE framework = 'CMMC' AND status = 'Not Started')::int AS not_started,
      COUNT(*) FILTER (WHERE framework = 'CMMC' AND status = 'In Progress')::int AS in_progress,
      COUNT(*) FILTER (WHERE framework = 'CMMC' AND status = 'Implemented')::int AS implemented,
      COUNT(*) FILTER (WHERE framework = 'CMMC' AND status = 'Audit Ready')::int AS audit_ready,
      COUNT(*) FILTER (WHERE framework = 'ITAR')::int AS itar_total,
      COUNT(*) FILTER (WHERE framework = 'ITAR' AND status IN ('Implemented', 'Audit Ready'))::int AS itar_implemented,
      MAX(updated_at) AS last_assessment_date
    FROM practices
  `

  // Fetch SPRS score
  const [sprsResult] = await sql`
    SELECT (110 - COALESCE(SUM(
      CASE
        WHEN risk_level = 'Critical' THEN 5
        WHEN risk_level = 'High' THEN 3
        WHEN risk_level = 'Medium' THEN 1
        ELSE 0
      END
    ), 0))::int AS sprs_score
    FROM practices
    WHERE framework = 'CMMC'
      AND status NOT IN ('Implemented', 'Audit Ready')
  `
  const sprsScore: number = sprsResult.sprs_score

  const score_pct = stats.total > 0
    ? Math.round(((stats.implemented + stats.audit_ready) / stats.total) * 100)
    : 0
  const itar_score_pct = stats.itar_total > 0
    ? Math.round((stats.itar_implemented / stats.itar_total) * 100)
    : 0

  // Fetch domain stats
  const domains = await sql`
    SELECT
      d.id, d.name, d.abbreviation,
      COUNT(p.id)::int AS total,
      COUNT(p.id) FILTER (WHERE p.status = 'Implemented')::int AS implemented,
      COUNT(p.id) FILTER (WHERE p.status = 'Audit Ready')::int AS audit_ready,
      COUNT(p.id) FILTER (WHERE p.status = 'In Progress')::int AS in_progress,
      COUNT(p.id) FILTER (WHERE p.status = 'Not Started')::int AS not_started
    FROM domains d
    LEFT JOIN practices p ON p.domain_id = d.id
    WHERE d.framework = 'CMMC'
    GROUP BY d.id
    ORDER BY d.abbreviation
  `

  const domainsWithPct = domains
    .map((d: any) => ({
      ...d,
      completion_pct: d.total > 0
        ? Math.round(((d.implemented + d.audit_ready) / d.total) * 100)
        : 0
    }))
    .sort((a: any, b: any) => a.completion_pct - b.completion_pct)

  // Fetch burndown data
  const burndown = await sql`
    WITH weeks AS (
      SELECT generate_series(
        date_trunc('week', NOW() - INTERVAL '90 days'),
        date_trunc('week', NOW()),
        INTERVAL '1 week'
      ) AS week_start
    )
    SELECT
      to_char(w.week_start, 'Mon DD') AS week,
      COUNT(p.id) FILTER (
        WHERE p.status IN ('Implemented', 'Audit Ready')
          AND date_trunc('week', p.updated_at) <= w.week_start
      )::int AS closed,
      (SELECT COUNT(*) FROM practices WHERE framework = 'CMMC')::int -
        COUNT(p.id) FILTER (
          WHERE p.status IN ('Implemented', 'Audit Ready')
            AND date_trunc('week', p.updated_at) <= w.week_start
        )::int AS open
    FROM weeks w
    LEFT JOIN practices p ON p.framework = 'CMMC'
    GROUP BY w.week_start
    ORDER BY w.week_start
  `

  // Fetch highest-risk Not Started practices for action strip
  const criticalPractices = await sql`
    SELECT p.practice_id, p.title, p.risk_level, d.abbreviation AS domain_abbr, d.id AS domain_id
    FROM practices p
    JOIN domains d ON d.id = p.domain_id
    WHERE p.status = 'Not Started'
      AND p.risk_level IN ('Critical', 'High')
    ORDER BY
      CASE p.risk_level WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 ELSE 3 END,
      p.practice_id
    LIMIT 3
  `

  // Format last assessment date
  const lastAssessmentDate = stats.last_assessment_date
    ? new Date(stats.last_assessment_date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      })
    : 'No data'

  function ragCardClass(pct: number) {
    if (pct >= 80) return 'border-green-500/30 bg-green-950/20 p-2.5 opacity-80 hover:opacity-100'
    if (pct >= 40) return 'border-amber-500/40 bg-amber-950/20 p-3 hover:opacity-90'
    return 'border-red-500/60 bg-red-950/30 p-3.5 ring-1 ring-red-900/40 hover:opacity-90'
  }

  function ragTextClass(pct: number) {
    if (pct >= 80) return 'text-green-400'
    if (pct >= 40) return 'text-amber-400'
    return 'text-red-400'
  }

  function ragPctSize(pct: number) {
    if (pct >= 80) return 'text-xs font-semibold'
    if (pct >= 40) return 'text-sm font-semibold'
    return 'text-base font-bold'
  }

  return (
    <AppShell orgName={orgName}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {orgName}
          </span>
          <span className="text-[11px] text-muted-foreground">Updated {lastAssessmentDate}</span>
        </div>

        {/* Score Hero */}
        <div className="py-4 border-b border-border">
          <div className="flex items-end gap-10">
            <div>
              <div className={`text-7xl font-bold leading-none tracking-tight ${ragTextClass(score_pct)}`}>
                <AnimatedNumber value={score_pct} /><span className="text-3xl font-light text-muted-foreground">%</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-widest font-medium">
                CMMC L2 Compliance Score
              </p>
            </div>
            <div className="border-l border-border pl-8">
              <div className={`text-5xl font-bold leading-none tracking-tight tabular-nums ${sprsScore >= 80 ? 'text-green-400' : sprsScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                <AnimatedNumber value={sprsScore} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-widest font-medium">
                SPRS Score <span className="text-[10px] normal-case tracking-normal">(0–110)</span>
              </p>
            </div>
            <div className="flex-1 pb-1.5">
              <AnimatedProgress value={score_pct} className="h-1.5" delay={400} />
              <p className="text-xs text-muted-foreground mt-1.5">
                {stats.implemented + stats.audit_ready} of {stats.total} practices complete
              </p>
            </div>
          </div>

          <div className="flex gap-0 mt-6 divide-x divide-border">
            {[
              { label: 'Not Started', value: stats.not_started, color: 'text-muted-foreground' },
              { label: 'In Progress', value: stats.in_progress, color: 'text-amber-400' },
              { label: 'Implemented', value: stats.implemented, color: 'text-blue-400' },
              { label: 'Audit Ready', value: stats.audit_ready, color: 'text-green-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex-1 px-5">
                <div className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical attention strip */}
        {criticalPractices.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Needs attention — {criticalPractices.length} critical/high risk · not started
            </p>
            {criticalPractices.map((p: any) => {
              const riskColor: Record<RiskLevel, string> = {
                Critical: 'text-red-400 bg-red-950/40 border-red-800/50',
                High: 'text-orange-400 bg-orange-950/40 border-orange-800/50',
                Medium: 'text-amber-400 bg-amber-950/40 border-amber-800/50',
                Low: 'text-zinc-400 bg-zinc-800 border-zinc-700',
              }
              return (
                <a
                  key={p.practice_id}
                  href={`/domain/${p.domain_id}`}
                  className="flex items-center gap-3 py-1.5 px-3 rounded-md hover:bg-accent transition-colors group"
                >
                  <span className="font-mono text-xs text-muted-foreground w-16 shrink-0">{p.practice_id}</span>
                  <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border shrink-0 ${riskColor[p.risk_level as RiskLevel]}`}>
                    {p.risk_level}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground w-7 shrink-0">{p.domain_abbr}</span>
                  <span className="text-xs text-foreground truncate flex-1">{p.title}</span>
                  <span className="text-muted-foreground text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0">→</span>
                </a>
              )
            })}
          </div>
        )}

        {/* Domain Health Grid */}
        <div>
          <h2 className="text-xs font-medium text-muted-foreground mb-3">Domain Health</h2>
          <div className="grid grid-cols-7 gap-3">
            {domainsWithPct.map((domain: any, i: number) => (
              <a
                key={domain.id}
                href={`/domain/${domain.id}`}
                className={`rounded-lg border transition-all hover:-translate-y-0.5 hover:shadow-md ${ragCardClass(domain.completion_pct)}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-foreground">
                    {domain.abbreviation}
                  </span>
                  <span className={`${ragPctSize(domain.completion_pct)} ${ragTextClass(domain.completion_pct)}`}>
                    {domain.completion_pct}%
                  </span>
                </div>
                <AnimatedProgress value={domain.completion_pct} className="h-1.5" delay={200 + i * 40} />
                <p className="text-[10px] text-muted-foreground mt-1.5 truncate">{domain.name}</p>
              </a>
            ))}
          </div>
        </div>

        {/* ITAR Summary */}
        <Card className="border-amber-600/35 bg-amber-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-500">ITAR Overlay</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div>
              <div className={`text-2xl font-bold ${ragTextClass(itar_score_pct)}`}>
                {itar_score_pct}%
              </div>
              <p className="text-xs text-muted-foreground">compliance score</p>
            </div>
            <div className="flex-1">
              <AnimatedProgress value={itar_score_pct} className="h-2" delay={300} />
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                {stats.itar_implemented} / {stats.itar_total}
              </p>
              <p className="text-xs text-muted-foreground">controls implemented</p>
            </div>
            <a
              href="/itar"
              className="text-xs text-amber-500 hover:text-amber-400 underline-offset-2 hover:underline"
            >
              View ITAR overlay →
            </a>
          </CardContent>
        </Card>

        {/* Charts */}
        <OverviewCharts
          burndownData={burndown as any[]}
          radarData={domainsWithPct.map((d: any) => ({
            domain: d.abbreviation,
            pct: d.completion_pct,
          }))}
        />
      </div>
    </AppShell>
  )
}
