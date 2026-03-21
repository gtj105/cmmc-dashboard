import type { InheritanceType } from '../../src/lib/types'

export interface SeedOverlayMapping {
  practice_id: string
  inheritance_type: InheritanceType
  source_title: string
  source_url: string
  rationale: string
  customer_actions: string
  notes: string
}

export interface SeedOverlayPack {
  key: 'm365_gcc_high' | 'azure_government' | 'microsoft_defender' | 'microsoft_purview'
  name: string
  provider: string
  status: 'available'
  enabled: boolean
  description: string
  mappings: SeedOverlayMapping[]
}

export function buildMappings(
  practiceIds: string[],
  inheritanceType: InheritanceType,
  sourceTitle: string,
  sourceUrl: string,
  rationale: string,
  customerActions: string,
  notes: string,
): SeedOverlayMapping[] {
  return practiceIds.map((practice_id) => ({
    practice_id,
    inheritance_type: inheritanceType,
    source_title: sourceTitle,
    source_url: sourceUrl,
    rationale,
    customer_actions: customerActions,
    notes,
  }))
}
