import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import sql from '@/lib/db'
import AppShell from '@/components/layout/AppShell'
import AnimatedNumber from '@/components/AnimatedNumber'
import AnimatedProgress from '@/components/AnimatedProgress'
import { PracticeTable } from '@/components/PracticeTable'
import { fetchEffectivePractices } from '@/lib/overlays'
import { computeBaselineTotals, computeCoverageTotals, computeResidualTotals } from '@/lib/overlay-scoring'
import { ragTextClass } from '@/lib/ui-utils'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

export default async function DomainPage({ params }: Props) {
  const session = await getServerSession(getAuthOptions())
  if (!session) redirect('/login')
  const canEdit = session.user.role === 'editor' || session.user.role === 'admin'

  const domainId = parseInt(params.id)
  if (isNaN(domainId)) notFound()

  const orgName = process.env.ORG_NAME ?? 'My Organization'

  const [domain] = await sql`
    SELECT * FROM domains WHERE id = ${domainId} AND framework = 'CMMC'
  `
  if (!domain) notFound()

  const {
    baselinePractices,
    effectivePractices,
    activePacks,
  } = await fetchEffectivePractices(sql, { domainId })
  const hasActiveOverlay = activePacks.length > 0
  const baselineTotals = computeBaselineTotals(baselinePractices)
  const coverageTotals = computeCoverageTotals(effectivePractices)
  const residualTotals = computeResidualTotals(effectivePractices)

  const pct = coverageTotals.score_pct
  const openControls = coverageTotals.total - coverageTotals.total_covered
  const notStarted = coverageTotals.not_started
  const evidenceGap = effectivePractices.filter((practice) =>
    practice.is_customer_scored &&
    (practice.status === 'Implemented' || practice.status === 'Audit Ready') &&
    !practice.evidence_exists,
  ).length

  // Ownership breakdown for segmented bar
  const ownershipSegments = hasActiveOverlay ? [
    { label: 'CSP',            count: coverageTotals.csp_inherited,          bar: 'bg-sky-500/70',     text: 'text-sky-400' },
    { label: 'Shared',         count: residualTotals.partial,                 bar: 'bg-amber-400/60',   text: 'text-amber-400' },
    { label: 'Validation req.', count: residualTotals.validation_required,    bar: 'bg-orange-500/60',  text: 'text-orange-400' },
    { label: 'OSC complete',   count: coverageTotals.osc_complete,            bar: 'bg-emerald-500/60', text: 'text-emerald-400' },
  ].filter((s) => s.count > 0) : []

  const ownershipTotal = ownershipSegments.reduce((sum, s) => sum + s.count, 0)

  return (
    <AppShell orgName={orgName}>
      <div className="space-y-8">
        <section className="space-y-4 border-b border-border pb-8">
          <p className="command-kicker">Domain command surface</p>

          {/* Domain identity */}
          <div className="flex items-end gap-3">
            <span className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              {domain.abbreviation}
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {domain.name}
            </h1>
          </div>

          {/* Score */}
          <div className={`text-6xl font-semibold leading-none tracking-tight ${ragTextClass(pct)}`}>
            <AnimatedNumber value={pct} />
            <span className="ml-1 text-2xl font-normal text-muted-foreground">%</span>
          </div>

          {/* Progress bar */}
          <AnimatedProgress value={pct} className="h-1.5 max-w-3xl" delay={300} />

          {/* Ownership bar — only when an overlay is active */}
          {hasActiveOverlay && ownershipTotal > 0 && (
            <div className="max-w-3xl space-y-1.5">
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-border/30">
                {ownershipSegments.map((seg, i) => (
                  <div
                    key={seg.label}
                    className={`ownership-segment ${seg.bar}`}
                    style={{ width: `${(seg.count / ownershipTotal) * 100}%`, animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {ownershipSegments.map((seg) => (
                  <span key={seg.label} className={`text-[11px] ${seg.text}`}>
                    <span className="tabular-nums font-semibold">{seg.count}</span>
                    <span className="ml-1 text-muted-foreground/60">{seg.label}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stat panels */}
          <div className="flex items-center justify-between max-w-3xl">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">Immediate Attention</h2>
          </div>
          <div className="stat-panel-grid grid gap-3 sm:grid-cols-3 max-w-3xl">
            <div className="command-panel px-4 py-3">
              <div className="text-2xl font-semibold tabular-nums text-foreground">{openControls}</div>
              <div className="command-kicker mt-1">Open controls</div>
            </div>
            <div className={`border px-4 py-3 ${notStarted === 0 ? 'border-border/40 bg-card/10' : 'border-red-900/50 bg-red-950/15'}`}>
              <div className={`text-2xl font-semibold tabular-nums ${notStarted === 0 ? 'text-muted-foreground/40' : 'text-red-300'}`}>{notStarted}</div>
              <div className="command-kicker mt-1">Not started</div>
            </div>
            <div className={`border px-4 py-3 ${evidenceGap === 0 ? 'border-border/40 bg-card/10' : 'border-amber-900/40 bg-amber-950/10'}`}>
              <div className={`text-2xl font-semibold tabular-nums ${evidenceGap === 0 ? 'text-muted-foreground/40' : 'text-amber-300'}`}>{evidenceGap}</div>
              <div className="command-kicker mt-1">Evidence gaps</div>
            </div>
          </div>

        </section>

        <PracticeTable practices={effectivePractices} canEdit={canEdit} />
      </div>
    </AppShell>
  )
}
