import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import sql from '@/lib/db'
import AppShell from '@/components/layout/AppShell'
import { getOrgName } from '@/lib/settings'
import { buildEffectivePractices, fetchActiveOverlayPacks, fetchMappingsForActivePacks, fetchOverlayValidationsForActivePacks } from '@/lib/overlays'
import type { EffectivePractice, Practice } from '@/lib/types'
import { RiskTable } from './RiskTable'
import type { RiskPractice } from './risk-page-data'

export const dynamic = 'force-dynamic'

export default async function RiskPage() {
  const session = await getServerSession(getAuthOptions())
  if (!session) redirect('/login')

  const orgName = await getOrgName()

  const practices = await sql<Practice[]>`
    SELECT p.*, d.name AS domain_name, d.abbreviation
    FROM practices p
    JOIN domains d ON d.id = p.domain_id
    WHERE p.risk_level IN ('High', 'Critical')
      AND p.framework IN ('CMMC', 'ITAR')
    ORDER BY
      CASE p.risk_level WHEN 'Critical' THEN 0 WHEN 'High' THEN 1 END,
      p.due_date ASC NULLS LAST
  `

  const activePacks = await fetchActiveOverlayPacks(sql)
  const [mappings, validations] = await Promise.all([
    fetchMappingsForActivePacks(sql, activePacks),
    fetchOverlayValidationsForActivePacks(sql, activePacks),
  ])
  const effectivePractices = buildEffectivePractices(practices, mappings, activePacks, validations) as Array<
    EffectivePractice & { domain_name: string; abbreviation: string }
  >
  const visiblePractices = effectivePractices.filter((p) => p.effective_risk_visibility) as RiskPractice[]

  return (
    <AppShell orgName={orgName}>
      <div className="space-y-8">
        <RiskTable practices={visiblePractices} />
      </div>
    </AppShell>
  )
}
