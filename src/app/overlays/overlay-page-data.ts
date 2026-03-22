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

export type OverlayMappingGroup = {
  key: Exclude<ImpactFilter, 'all'>
  title: string
  note: string
  items: EffectiveOverlayMapping[]
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

export function buildEffectiveMappings(mappings: OverlayMappingsResponse['mappings']): EffectiveOverlayMapping[] {
  return mappings.map((mapping) => ({
    ...mapping,
    effectiveInheritanceType: resolveEffectiveInheritanceType(
      mapping.inheritance_type,
      mapping.validated,
      mapping.resolved_inheritance_type,
    ),
  }))
}

export function buildImpactedCounts(mappings: EffectiveOverlayMapping[]) {
  return mappings.reduce(
    (acc, mapping) => {
      if (mapping.effectiveInheritanceType !== 'none') {
        acc[mapping.effectiveInheritanceType] += 1
      }
      return acc
    },
    {
      full: 0,
      partial: 0,
      validation_required: 0,
      none: 0,
    },
  )
}

export function filterImpactedMappings(
  impactedMappings: EffectiveOverlayMapping[],
  impactFilter: ImpactFilter,
): EffectiveOverlayMapping[] {
  if (impactFilter === 'all') return impactedMappings
  return impactedMappings.filter((mapping) => mapping.effectiveInheritanceType === impactFilter)
}

export function groupMappings(
  filteredMappings: EffectiveOverlayMapping[],
  impactFilter: ImpactFilter,
): OverlayMappingGroup[] {
  const groups: OverlayMappingGroup[] = [
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

  return groups.filter((group) => group.items.length > 0)
}

export function buildSummaryCards(summary: OverlaySummary | null) {
  return [
    { label: 'Active overlays', value: summary?.active_overlays ?? 0, tone: 'text-foreground' },
    { label: 'Customer-owned controls', value: summary?.customer_owned_controls ?? 0, tone: 'text-amber-300' },
    { label: 'Fully inherited controls', value: summary?.fully_inherited_controls ?? 0, tone: 'text-green-300' },
    { label: 'Shared controls', value: summary?.shared_controls ?? 0, tone: 'text-sky-300' },
    { label: 'Validation required', value: summary?.validation_required_controls ?? 0, tone: 'text-red-300' },
  ]
}
