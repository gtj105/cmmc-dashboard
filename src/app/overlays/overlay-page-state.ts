'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { InheritanceType, OverlayPackKey, OverlayPackStatus } from '@/lib/types'

export const ORG_DEFAULT = 'My Organization'

export const PACK_LAYOUT: Array<{
  key: OverlayPackKey
  name: string
  provider: string
}> = [
  { key: 'm365_gcc_high', name: 'Microsoft 365 GCC High', provider: 'Microsoft' },
  { key: 'azure_government', name: 'Azure Government', provider: 'Microsoft' },
  { key: 'microsoft_defender', name: 'Microsoft Defender', provider: 'Microsoft' },
  { key: 'microsoft_purview', name: 'Microsoft Purview', provider: 'Microsoft' },
]

export type OverlaySummary = {
  active_overlays: number
  available_overlay_packs: number
  total_controls: number
  customer_owned_controls: number
  fully_inherited_controls: number
  shared_controls: number
  validation_required_controls: number
}

export type ImpactFilter = 'all' | 'full' | 'partial' | 'validation_required'

export type OverlayPackCard = {
  id: number
  key: OverlayPackKey
  name: string
  provider: string
  status: OverlayPackStatus
  enabled: boolean
  description: string
  impacted_count: number
  full_count: number
  partial_count: number
  none_count: number
  validation_required_count: number
}

export type OverlayMappingsResponse = {
  pack: OverlayPackCard
  mappings: Array<{
    id: number
    practice_id: string
    inheritance_type: InheritanceType
    source_title: string
    source_url: string
    rationale: string
    customer_actions: string
    notes: string | null
    practice_title: string | null
    practice_framework: string | null
    practice_status: string | null
    practice_risk_level: string | null
    domain_abbreviation: string | null
    validated: boolean | null
    resolved_inheritance_type: InheritanceType | null
    validation_notes: string | null
  }>
}

export type EffectiveOverlayMapping = OverlayMappingsResponse['mappings'][number] & {
  effectiveInheritanceType: InheritanceType
}

export function formatCount(value: number): string {
  return value.toLocaleString('en-US')
}

export function displayStatusLabel(status: OverlayPackStatus, enabled: boolean): string {
  if (status !== 'available') return 'not_loaded'
  return enabled ? 'active' : 'available'
}

export function residualImpactNote(packKey: OverlayPackKey, status: OverlayPackStatus, enabled: boolean): string {
  if (status !== 'available') {
    return 'Mapping pack not loaded, so residual scoring stays unchanged.'
  }
  if (!enabled) {
    return 'Available pack; enable it to remove fully inherited controls from residual scoring.'
  }
  if (packKey === 'm365_gcc_high') {
    return 'Active pack removes fully inherited controls from the customer-owned denominator.'
  }
  return 'Active pack changes residual scoring only for mapped controls.'
}

export function resolveEffectiveInheritanceType(
  inheritanceType: InheritanceType,
  validated: boolean | null,
  resolvedInheritanceType: InheritanceType | null,
): InheritanceType {
  return validated ? resolvedInheritanceType ?? inheritanceType : inheritanceType
}

export function validationStateLabel(
  inheritanceType: InheritanceType,
  validated: boolean | null,
  resolvedInheritanceType: InheritanceType | null,
): string {
  if (inheritanceType === 'validation_required') {
    if (validated && resolvedInheritanceType) return `validated as ${resolvedInheritanceType}`
    return 'validation required'
  }
  return 'not required'
}

export function buildGroupedMappings(
  filteredMappings: EffectiveOverlayMapping[],
  impactFilter: ImpactFilter,
) {
  const groups: Array<{
    key: ImpactFilter
    title: string
    note: string
    items: EffectiveOverlayMapping[]
  }> = [
    {
      key: 'full',
      title: 'Fully inherited',
      note: 'Removed from residual scoring once the pack is active.',
      items: [],
    },
    {
      key: 'partial',
      title: 'Partially inherited',
      note: 'Shared responsibility stays in the customer-owned denominator.',
      items: [],
    },
    {
      key: 'validation_required',
      title: 'Validation required',
      note: 'Seeded from Microsoft guidance until the deployment is validated.',
      items: [],
    },
  ]

  for (const mapping of filteredMappings) {
    const group = groups.find((candidate) => candidate.key === mapping.effectiveInheritanceType)
    if (group) group.items.push(mapping)
  }

  return groups.filter((group) => group.items.length > 0 || impactFilter !== 'all')
}

export function useOverlayPageData(status: string) {
  const router = useRouter()
  const [summary, setSummary] = useState<OverlaySummary | null>(null)
  const [packs, setPacks] = useState<OverlayPackCard[]>([])
  const [selectedKey, setSelectedKey] = useState<OverlayPackKey>('m365_gcc_high')
  const [mappings, setMappings] = useState<OverlayMappingsResponse['mappings']>([])
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>('all')
  const [loading, setLoading] = useState(true)
  const [mappingsLoading, setMappingsLoading] = useState(false)
  const [refreshingKey, setRefreshingKey] = useState<OverlayPackKey | null>(null)
  const [error, setError] = useState<string | null>(null)
  const selectedKeyRef = useRef<OverlayPackKey>('m365_gcc_high')
  const mappingRequestKeyRef = useRef<OverlayPackKey>('m365_gcc_high')
  const packRequestIdRef = useRef(0)

  useEffect(() => {
    selectedKeyRef.current = selectedKey
  }, [selectedKey])

  async function loadPacks(preferredKey?: OverlayPackKey) {
    const requestId = ++packRequestIdRef.current
    const res = await fetch('/api/overlays')
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data?.error ?? 'Failed to load overlays')
    }
    if (packRequestIdRef.current !== requestId) return

    setPacks(data.packs)
    setSummary(data.summary)

    const nextSelected =
      preferredKey && data.packs.some((pack: OverlayPackCard) => pack.key === preferredKey)
        ? preferredKey
        : data.packs.find((pack: OverlayPackCard) => pack.enabled)?.key
          ?? data.packs.find((pack: OverlayPackCard) => pack.key === 'm365_gcc_high')?.key
          ?? data.packs[0]?.key
          ?? 'm365_gcc_high'

    setSelectedKey(nextSelected)
  }

  async function loadMappings(key: OverlayPackKey) {
    mappingRequestKeyRef.current = key
    setMappingsLoading(true)
    setMappings([])
    const res = await fetch(`/api/overlays/${key}/mappings`)
    const data: OverlayMappingsResponse | { error?: string } = await res.json()
    if (!res.ok) {
      if (mappingRequestKeyRef.current === key) setMappingsLoading(false)
      throw new Error((data as { error?: string }).error ?? 'Failed to load mappings')
    }
    if (mappingRequestKeyRef.current !== key || selectedKeyRef.current !== key) return
    setMappings((data as OverlayMappingsResponse).mappings)
    setMappingsLoading(false)
  }

  useEffect(() => {
    if (status !== 'authenticated') return

    let active = true
    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        await loadPacks()
        if (!active) return
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load overlays')
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated') return

    let active = true
    ;(async () => {
      try {
        await loadMappings(selectedKey)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load mappings')
        setMappings([])
        setMappingsLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [selectedKey, status])

  const packByKey = useMemo(
    () => new Map(packs.map((pack) => [pack.key, pack] as const)),
    [packs],
  )

  const selectedPack = packByKey.get(selectedKey) ?? null
  const effectiveMappings = useMemo(
    () =>
      mappings.map((mapping) => ({
        ...mapping,
        effectiveInheritanceType: resolveEffectiveInheritanceType(
          mapping.inheritance_type,
          mapping.validated,
          mapping.resolved_inheritance_type,
        ),
      })) as EffectiveOverlayMapping[],
    [mappings],
  )

  const impactedMappings = useMemo(
    () => effectiveMappings.filter((mapping) => mapping.effectiveInheritanceType !== 'none'),
    [effectiveMappings],
  )

  const impactedCounts = useMemo(
    () =>
      impactedMappings.reduce(
        (acc, mapping) => {
          acc[mapping.effectiveInheritanceType] += 1
          return acc
        },
        {
          full: 0,
          partial: 0,
          validation_required: 0,
          none: 0,
        },
      ),
    [impactedMappings],
  )

  const filteredMappings = useMemo(() => {
    if (impactFilter === 'all') return impactedMappings
    return impactedMappings.filter((mapping) => mapping.effectiveInheritanceType === impactFilter)
  }, [impactedMappings, impactFilter])

  const groupedMappings = useMemo(
    () => buildGroupedMappings(filteredMappings, impactFilter),
    [filteredMappings, impactFilter],
  )

  async function handleToggle(key: OverlayPackKey, enabled: boolean) {
    if (refreshingKey) return
    setRefreshingKey(key)
    setError(null)
    try {
      const res = await fetch(`/api/overlays/${key}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error ?? 'Failed to toggle overlay')
      }
      await loadPacks(selectedKeyRef.current)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle overlay')
    } finally {
      setRefreshingKey(null)
    }
  }

  const summaryCards = [
    { label: 'Active overlays', value: summary?.active_overlays ?? 0, tone: 'text-foreground' },
    { label: 'Customer-owned controls', value: summary?.customer_owned_controls ?? 0, tone: 'text-amber-300' },
    { label: 'Fully inherited controls', value: summary?.fully_inherited_controls ?? 0, tone: 'text-green-300' },
    { label: 'Shared controls', value: summary?.shared_controls ?? 0, tone: 'text-sky-300' },
    { label: 'Validation required', value: summary?.validation_required_controls ?? 0, tone: 'text-red-300' },
  ]

  return {
    error,
    groupedMappings,
    handleToggle,
    impactFilter,
    impactedCounts,
    impactedMappings,
    loading,
    mappings,
    mappingsLoading,
    packByKey,
    refreshingKey,
    selectedKey,
    selectedPack,
    setImpactFilter,
    setSelectedKey,
    summaryCards,
  }
}
