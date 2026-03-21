import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import sql from '@/lib/db'
import AppShell from '@/components/layout/AppShell'
import { Progress } from '@/components/ui/progress'
import { PracticeTable } from '@/components/PracticeTable'
import type { Practice } from '@/lib/types'
import { ragTextClass } from '@/lib/ui-utils'

export const dynamic = 'force-dynamic'

export default async function ITARPage() {
  const session = await getServerSession(getAuthOptions())
  if (!session) redirect('/login')
  const canEdit = session.user.role === 'editor' || session.user.role === 'admin'

  const orgName = process.env.ORG_NAME ?? 'My Organization'

  const practices = await sql<Practice[]>`
    SELECT * FROM practices WHERE framework = 'ITAR' ORDER BY practice_id
  `

  const total = practices.length
  const done = practices.filter((p) => p.status === 'Implemented' || p.status === 'Audit Ready').length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const categoryMap: Record<string, string> = {
    'ITAR-P': 'Personnel',
    'ITAR-DR': 'Data Residency',
    'ITAR-AB': 'Access Boundary',
    'ITAR-D': 'Disclosure',
    'ITAR-T': 'Training',
  }

  const categories = Object.entries(categoryMap).map(([prefix, label]) => {
    const categoryPractices = practices.filter((p) => p.practice_id.startsWith(`${prefix}-`))
    const ready = categoryPractices.filter((p) => p.status === 'Implemented' || p.status === 'Audit Ready').length
    const categoryPct = categoryPractices.length > 0 ? Math.round((ready / categoryPractices.length) * 100) : 0
    return {
      prefix,
      label,
      total: categoryPractices.length,
      ready,
      open: categoryPractices.length - ready,
      pct: categoryPct,
    }
  }).sort((a, b) => a.pct - b.pct)

  return (
    <AppShell orgName={orgName}>
      <div className="space-y-8">
        <section className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
          <div className="space-y-4">
            <p className="command-kicker">Overlay command surface</p>
            <div className="flex flex-wrap items-end gap-4">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Export Control Overlay</h1>
              <span className="rounded-sm border border-amber-950/70 bg-amber-950/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                ITAR
              </span>
            </div>
            <p className="max-w-[44rem] text-sm leading-6 text-muted-foreground">
              ITAR and EAR compliance controls organized as an overlay on top of the core CMMC program.
            </p>

            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <div className={`text-6xl font-semibold leading-none tracking-tight ${ragTextClass(pct)}`}>
                {pct}<span className="ml-1 text-2xl font-normal text-muted-foreground">%</span>
              </div>
              <p className="max-w-[18rem] pb-1 text-sm leading-6 text-muted-foreground">
                Overlay readiness across export-control-specific controls.
              </p>
            </div>
            <Progress value={pct} className="h-1.5 max-w-3xl" />
          </div>

          <div className="command-panel p-4">
            <p className="command-kicker">Category pressure</p>
            <div className="mt-4 space-y-3">
              {categories.map((category) => (
                <div key={category.prefix} className="grid grid-cols-[minmax(0,1fr)_88px] items-center gap-4 border-t border-border pt-3 first:border-t-0 first:pt-0">
                  <div>
                    <p className="text-sm text-foreground">{category.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{category.open} open of {category.total} controls</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-semibold tabular-nums ${ragTextClass(category.pct)}`}>{category.pct}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PracticeTable practices={practices as Practice[]} canEdit={canEdit} />
      </div>
    </AppShell>
  )
}
