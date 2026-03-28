import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import sql from '@/lib/db'
import AppShell from '@/components/layout/AppShell'
import {
  buildEffectivePractices,
  fetchActiveOverlayPacks,
  fetchMappingsForActivePacks,
  fetchOverlayMappingsForPack,
  fetchOverlayPackSummaries,
  fetchOverlayValidationsForActivePacks,
} from '@/lib/overlays'
import { computeResidualTotals } from '@/lib/overlays/scoring'
import type { OverlayPackKey, Practice } from '@/lib/types'
import { OverlayPageClient } from './OverlayPageClient'

export const dynamic = 'force-dynamic'

export default async function OverlayPage() {
  const session = await getServerSession(getAuthOptions())
  if (!session) redirect('/login')

  const orgName = process.env.ORG_NAME ?? 'My Organization'

  const [practices, packs, activePacks] = await Promise.all([
    sql<Practice[]>`SELECT * FROM practices WHERE framework = 'CMMC' ORDER BY practice_id`,
    fetchOverlayPackSummaries(sql),
    fetchActiveOverlayPacks(sql),
  ])

  const [validations, mappings] = await Promise.all([
    fetchOverlayValidationsForActivePacks(sql, activePacks),
    fetchMappingsForActivePacks(sql, activePacks),
  ])

  const effectivePractices = buildEffectivePractices(practices, mappings, activePacks, validations)
  const residualTotals = computeResidualTotals(effectivePractices)

  const summary = {
    active_overlays: activePacks.length,
    available_overlay_packs: packs.filter((p) => p.status === 'available').length,
    total_controls: residualTotals.total,
    customer_owned_controls: residualTotals.customer_owned_total,
    fully_inherited_controls: residualTotals.full,
    shared_controls: residualTotals.partial,
    validation_required_controls: residualTotals.validation_required,
  }

  const initialSelectedKey: OverlayPackKey =
    packs.find((p) => p.enabled)?.key ??
    (packs.some((p) => p.key === 'm365_gcc_high') ? 'm365_gcc_high' : packs[0]?.key ?? 'm365_gcc_high')

  const initialMappingsData = await fetchOverlayMappingsForPack(sql, initialSelectedKey)

  return (
    <AppShell orgName={orgName}>
      <OverlayPageClient
        initialPacks={packs}
        initialSummary={summary}
        initialMappings={initialMappingsData}
        initialSelectedKey={initialSelectedKey}
      />
    </AppShell>
  )
}
