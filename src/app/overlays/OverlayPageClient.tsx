'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import type { OverlayPackKey } from '@/lib/types'
import {
  buildEffectiveMappings,
  buildImpactedCounts,
  buildSummaryCards,
  filterImpactedMappings,
  formatCount,
  groupMappings,
  type ImpactFilter,
  type OverlayMappingsResponse,
  type OverlayPackCard,
  type OverlaySummary,
} from './overlay-page-data'
import OverlayInventory from './overlay-inventory'
import ImpactedControls from './impacted-controls'

interface OverlayPageClientProps {
  initialPacks: OverlayPackCard[]
  initialSummary: OverlaySummary
  initialMappings: OverlayMappingsResponse['mappings']
  initialSelectedKey: OverlayPackKey
}

export function OverlayPageClient({
  initialPacks,
  initialSummary,
  initialMappings,
  initialSelectedKey,
}: OverlayPageClientProps) {
  const router = useRouter()
  const [packs, setPacks] = useState(initialPacks)
  const [summary, setSummary] = useState(initialSummary)
  const [selectedKey, setSelectedKey] = useState(initialSelectedKey)
  const [mappings, setMappings] = useState(initialMappings)
  const [mappingsLoading, setMappingsLoading] = useState(false)
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>('all')
  const [refreshingKey, setRefreshingKey] = useState<OverlayPackKey | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    let active = true
    setMappingsLoading(true)
    setMappings([])
    setError(null)
    fetch(`/api/overlays/${selectedKey}/mappings`)
      .then((r) => r.json())
      .then((data: OverlayMappingsResponse | { error?: string }) => {
        if (!active) return
        if ('error' in data && data.error) throw new Error(data.error)
        setMappings((data as OverlayMappingsResponse).mappings)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load mappings')
      })
      .finally(() => {
        if (active) setMappingsLoading(false)
      })
    return () => {
      active = false
    }
  }, [selectedKey])

  async function handleToggle(key: OverlayPackKey, enabled: boolean) {
    if (refreshingKey) return
    setRefreshingKey(key)
    setError(null)
    try {
      const res = await apiFetch(`/api/overlays/${key}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Failed to toggle overlay')

      const packsRes = await apiFetch('/api/overlays')
      const packsData = await packsRes.json()
      setPacks(packsData.packs)
      setSummary(packsData.summary)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle overlay')
    } finally {
      setRefreshingKey(null)
    }
  }

  const packByKey = useMemo(() => new Map(packs.map((p) => [p.key, p] as const)), [packs])
  const selectedPack = packByKey.get(selectedKey) ?? null
  const effectiveMappings = useMemo(() => buildEffectiveMappings(mappings), [mappings])
  const impactedMappings = useMemo(
    () => effectiveMappings.filter((m) => m.effectiveInheritanceType !== 'none'),
    [effectiveMappings],
  )
  const impactedCounts = useMemo(() => buildImpactedCounts(impactedMappings), [impactedMappings])
  const filteredMappings = useMemo(
    () => filterImpactedMappings(impactedMappings, impactFilter),
    [impactedMappings, impactFilter],
  )
  const groupedMappings = useMemo(() => groupMappings(filteredMappings, impactFilter), [filteredMappings, impactFilter])
  const summaryCards = useMemo(() => buildSummaryCards(summary), [summary])

  return (
    <div className="space-y-8">
      <section className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">
        <div className="space-y-4">
          <p className="command-kicker">Compliance command surface</p>
          <div className="flex flex-wrap items-end gap-4">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Enclave Overlays</h1>
            <Badge variant="outline" className="border-border bg-card/40 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              org-level
            </Badge>
          </div>
          <p className="max-w-[52rem] text-sm leading-6 text-muted-foreground">
            Enable documentation-based overlay packs across the enclave, keep raw control status intact, and preview
            the impacted control set before you commit the toggle.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {summaryCards.map((card) => (
              <div key={card.label} className="command-panel px-4 py-3">
                <div className={`text-2xl font-semibold tabular-nums ${card.tone}`}>
                  {formatCount(card.value)}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {card.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <OverlayInventory
          handleToggle={handleToggle}
          packByKey={packByKey}
          refreshingKey={refreshingKey}
          selectedKey={selectedKey}
          setSelectedKey={setSelectedKey}
        />
      </section>

      {error && (
        <div className="command-panel border-amber-900/60 bg-amber-950/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      )}
      <ImpactedControls
        groupedMappings={groupedMappings}
        impactFilter={impactFilter}
        impactedCounts={impactedCounts}
        impactedMappingsLength={impactedMappings.length}
        mappingsLength={mappings.length}
        mappingsLoading={mappingsLoading}
        selectedPack={selectedPack}
        setImpactFilter={setImpactFilter}
      />
    </div>
  )
}
