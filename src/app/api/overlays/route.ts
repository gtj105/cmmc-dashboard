import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import sql from '@/lib/db'
import {
  buildEffectivePractices,
  fetchMappingsForActivePacks,
  fetchOverlayPackSummaries,
  fetchActiveOverlayPacks,
  fetchOverlayValidationsForActivePacks,
} from '@/lib/overlays'
import type { Practice } from '@/lib/types'
import { computeResidualTotals } from '@/lib/overlays/scoring'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [practices, packs, activePacks] = await Promise.all([
    sql<Practice[]>`
      SELECT * FROM practices WHERE framework = 'CMMC' ORDER BY practice_id
    `,
    fetchOverlayPackSummaries(sql),
    fetchActiveOverlayPacks(sql),
  ])
  const validations = await fetchOverlayValidationsForActivePacks(sql, activePacks)
  const mappings = await fetchMappingsForActivePacks(sql, activePacks)
  const effectivePractices = buildEffectivePractices(practices, mappings, activePacks, validations)
  const residualTotals = computeResidualTotals(effectivePractices)

  return NextResponse.json({
    packs,
    summary: {
      active_overlays: activePacks.length,
      available_overlay_packs: packs.filter((pack) => pack.status === 'available').length,
      total_controls: residualTotals.total,
      customer_owned_controls: residualTotals.customer_owned_total,
      fully_inherited_controls: residualTotals.full,
      shared_controls: residualTotals.partial,
      validation_required_controls: residualTotals.validation_required,
    },
  })
}
