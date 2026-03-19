import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sql from '@/lib/db'
import AppShell from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PracticeTable } from '@/components/PracticeTable'
import type { Practice } from '@/lib/types'

interface Props {
  params: { id: string }
}

export default async function DomainPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const domainId = parseInt(params.id)
  if (isNaN(domainId)) notFound()

  const orgName = process.env.ORG_NAME ?? 'My Organization'

  const [domain] = await sql`
    SELECT * FROM domains WHERE id = ${domainId} AND framework = 'CMMC'
  `
  if (!domain) notFound()

  const practices = await sql<Practice[]>`
    SELECT * FROM practices WHERE domain_id = ${domainId} ORDER BY practice_id
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

  return (
    <AppShell orgName={orgName}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold text-primary">
                {domain.abbreviation}
              </span>
              <h1 className="text-xl font-semibold text-foreground">{domain.name}</h1>
            </div>
            {domain.description && (
              <p className="text-sm text-muted-foreground">{domain.description}</p>
            )}
          </div>
          <Card className="w-40 shrink-0">
            <CardContent className="pt-4 pb-4 text-right">
              <div className={`text-2xl font-bold ${ragTextClass(pct)}`}>{pct}%</div>
              <Progress value={pct} className="mt-1 h-1.5" />
              <p className="text-[10px] text-muted-foreground mt-1">
                {done} / {total} practices
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Practice Table */}
        <PracticeTable practices={practices as Practice[]} />
      </div>
    </AppShell>
  )
}
