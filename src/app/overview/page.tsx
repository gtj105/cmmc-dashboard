import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sql from '@/lib/db'
import AppShell from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import OverviewCharts from './OverviewCharts'

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

  const domainsWithPct = domains.map((d: any) => ({
    ...d,
    completion_pct: d.total > 0
      ? Math.round(((d.implemented + d.audit_ready) / d.total) * 100)
      : 0
  }))

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

  // Format last assessment date
  const lastAssessmentDate = stats.last_assessment_date
    ? new Date(stats.last_assessment_date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      })
    : 'No data'

  function ragClass(pct: number) {
    if (pct >= 80) return 'border-green-500/40 bg-green-950/30'
    if (pct >= 40) return 'border-amber-500/40 bg-amber-950/20'
    return 'border-red-500/40 bg-red-950/20'
  }

  function ragTextClass(pct: number) {
    if (pct >= 80) return 'text-green-400'
    if (pct >= 40) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <AppShell orgName={orgName}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last updated: {lastAssessmentDate}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle>Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${ragTextClass(score_pct)}`}>
                {score_pct}%
              </div>
              <Progress value={score_pct} className="mt-2 h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.implemented + stats.audit_ready} / {stats.total} practices
              </p>
            </CardContent>
          </Card>

          {[
            { label: 'Not Started', value: stats.not_started, color: 'text-zinc-400' },
            { label: 'In Progress', value: stats.in_progress, color: 'text-amber-400' },
            { label: 'Implemented', value: stats.implemented, color: 'text-blue-400' },
            { label: 'Audit Ready', value: stats.audit_ready, color: 'text-green-400' },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardTitle>{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${color}`}>{value}</div>
                <p className="text-xs text-muted-foreground mt-1">practices</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Domain Health Grid */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Domain Health</h2>
          <div className="grid grid-cols-7 gap-3">
            {domainsWithPct.map((domain: any) => (
              <a
                key={domain.id}
                href={`/domain/${domain.id}`}
                className={`rounded-lg border p-3 transition-opacity hover:opacity-90 ${ragClass(domain.completion_pct)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-foreground">
                    {domain.abbreviation}
                  </span>
                  <span className={`text-xs font-semibold ${ragTextClass(domain.completion_pct)}`}>
                    {domain.completion_pct}%
                  </span>
                </div>
                <Progress value={domain.completion_pct} className="h-1" />
                <p className="text-[10px] text-muted-foreground mt-1 truncate">{domain.name}</p>
              </a>
            ))}
          </div>
        </div>

        {/* ITAR Summary */}
        <Card className="border-purple-500/30 bg-purple-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-purple-400">ITAR Overlay</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div>
              <div className={`text-2xl font-bold ${ragTextClass(itar_score_pct)}`}>
                {itar_score_pct}%
              </div>
              <p className="text-xs text-muted-foreground">compliance score</p>
            </div>
            <div className="flex-1">
              <Progress value={itar_score_pct} className="h-2" />
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                {stats.itar_implemented} / {stats.itar_total}
              </p>
              <p className="text-xs text-muted-foreground">controls implemented</p>
            </div>
            <a
              href="/itar"
              className="text-xs text-purple-400 hover:text-purple-300 underline-offset-2 hover:underline"
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
