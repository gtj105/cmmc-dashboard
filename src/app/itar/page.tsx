import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sql from '@/lib/db'
import AppShell from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PracticeTable } from '@/components/PracticeTable'
import type { Practice } from '@/lib/types'

export default async function ITARPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const orgName = process.env.ORG_NAME ?? 'My Organization'

  const practices = await sql<Practice[]>`
    SELECT * FROM practices WHERE framework = 'ITAR' ORDER BY practice_id
  `

  const total = practices.length
  const done = practices.filter(
    (p) => p.status === 'Implemented' || p.status === 'Audit Ready'
  ).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  function ragTextClass(p: number) {
    if (p >= 80) return 'text-green-400'
    if (p >= 40) return 'text-amber-400'
    return 'text-red-400'
  }

  // Group practices by category (stored in practice_id prefix: ITAR-P, ITAR-DR, ITAR-AB, ITAR-D, ITAR-T)
  const categoryMap: Record<string, string> = {
    'ITAR-P': 'Personnel',
    'ITAR-DR': 'Data Residency',
    'ITAR-AB': 'Access Boundary',
    'ITAR-D': 'Disclosure',
    'ITAR-T': 'Training',
  }

  return (
    <AppShell orgName={orgName}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-900/40 text-purple-400 border border-purple-700/50">
                ITAR
              </span>
              <h1 className="text-xl font-semibold text-foreground">Export Control Overlay</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              ITAR and EAR compliance controls across 5 categories
            </p>
          </div>
          <Card className="w-44 shrink-0 border-purple-500/30">
            <CardContent className="pt-4 pb-4 text-right">
              <div className={`text-2xl font-bold ${ragTextClass(pct)}`}>{pct}%</div>
              <Progress value={pct} className="mt-1 h-1.5" />
              <p className="text-[10px] text-muted-foreground mt-1">
                {done} / {total} controls
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category summary cards */}
        <div className="grid grid-cols-5 gap-3">
          {Object.entries(categoryMap).map(([prefix, label]) => {
            const catPractices = practices.filter((p) => p.practice_id.startsWith(prefix + '-'))
            const catDone = catPractices.filter(
              (p) => p.status === 'Implemented' || p.status === 'Audit Ready'
            ).length
            const catPct = catPractices.length > 0
              ? Math.round((catDone / catPractices.length) * 100)
              : 0
            return (
              <Card key={prefix} className="border-purple-500/20">
                <CardHeader className="pb-1 pt-3 px-3">
                  <CardTitle className="text-purple-400 text-xs">{label}</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className={`text-lg font-bold ${ragTextClass(catPct)}`}>{catPct}%</div>
                  <p className="text-[10px] text-muted-foreground">{catDone}/{catPractices.length}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Practice Table */}
        <PracticeTable practices={practices as Practice[]} />
      </div>
    </AppShell>
  )
}
