import type {
  EffectivePractice,
  InheritanceType,
  OverlayMapping,
  OverlayPack,
  OverlayValidation,
  Practice,
} from '@/lib/types'

const CREDIT_GRANTING_PRECEDENCE: InheritanceType[] = ['full', 'partial']

function isCompleteStatus(status: Practice['status']) {
  return status === 'Implemented' || status === 'Audit Ready'
}

function pickPreferredInheritanceType(mappings: OverlayMapping[]): InheritanceType | null {
  for (const inheritanceType of CREDIT_GRANTING_PRECEDENCE) {
    if (mappings.some((mapping) => mapping.inheritance_type === inheritanceType)) {
      return inheritanceType
    }
  }
  if (mappings.some((mapping) => mapping.inheritance_type === 'validation_required')) {
    return 'validation_required'
  }
  return null
}

function pickPreferredMapping(mappings: OverlayMapping[]): OverlayMapping | null {
  const preferredType = pickPreferredInheritanceType(mappings)
  if (!preferredType) return null

  return mappings.find((mapping) => mapping.inheritance_type === preferredType) ?? null
}

function buildValidationLookup(validations: OverlayValidation[]) {
  const lookup = new Map<number, OverlayValidation>()
  for (const validation of validations) lookup.set(validation.overlay_mapping_id, validation)
  return lookup
}

function resolveValidatedInheritance(
  mapping: OverlayMapping,
  validation: OverlayValidation | undefined,
): InheritanceType {
  if (mapping.inheritance_type !== 'validation_required') return mapping.inheritance_type
  if (!validation?.validated) return 'validation_required'
  return validation.resolved_inheritance_type ?? 'validation_required'
}

export function resolveEffectiveInheritance(
  inheritanceTypes: Array<InheritanceType | null | undefined>,
): InheritanceType | null {
  for (const inheritanceType of CREDIT_GRANTING_PRECEDENCE) {
    if (inheritanceTypes.some((value) => value === inheritanceType)) {
      return inheritanceType
    }
  }
  if (inheritanceTypes.some((value) => value === 'validation_required')) {
    return 'validation_required'
  }
  if (inheritanceTypes.some((value) => value === 'none')) {
    return 'none'
  }
  return null
}

export function buildEffectivePractices(
  practices: Practice[],
  mappings: OverlayMapping[],
  packs: OverlayPack[] = [],
  validations: OverlayValidation[] = [],
): EffectivePractice[] {
  const packById = new Map(packs.map((pack) => [pack.id, pack] as const))
  const validationByMappingId = buildValidationLookup(validations)
  const mappingsByPractice = new Map<string, OverlayMapping[]>()

  for (const mapping of mappings) {
    const current = mappingsByPractice.get(mapping.practice_id) ?? []
    current.push(mapping)
    mappingsByPractice.set(mapping.practice_id, current)
  }

  return practices.map((practice) => {
    const practiceMappings = mappingsByPractice.get(practice.practice_id) ?? []
    const candidateMappings = practiceMappings.map((mapping) => ({
      mapping,
      effectiveInheritanceType: resolveValidatedInheritance(mapping, validationByMappingId.get(mapping.id)),
    }))
    const resolvedInheritanceType = resolveEffectiveInheritance(
      candidateMappings.map((candidate) => candidate.effectiveInheritanceType),
    )
    const effectiveInheritanceType: InheritanceType = resolvedInheritanceType ?? 'none'
    const preferredMapping =
      candidateMappings.find((candidate) => candidate.effectiveInheritanceType === effectiveInheritanceType)?.mapping ??
      pickPreferredMapping(practiceMappings)
    const preferredPack = preferredMapping ? packById.get(preferredMapping.overlay_pack_id) ?? null : null
    const isFullyInherited = effectiveInheritanceType === 'full'
    const isSharedResponsibility = effectiveInheritanceType === 'partial'
    const requiresValidation = effectiveInheritanceType === 'validation_required'
    const isCustomerScored = !isFullyInherited
    const effectiveVisibility = !isFullyInherited

    return {
      ...practice,
      overlay_pack_key: preferredPack?.key ?? null,
      overlay_pack_name: preferredPack?.name ?? null,
      inheritance_type: preferredMapping?.inheritance_type ?? null,
      effective_inheritance_type: effectiveInheritanceType,
      source_title: preferredMapping?.source_title ?? null,
      source_url: preferredMapping?.source_url ?? null,
      customer_actions: preferredMapping?.customer_actions ?? null,
      effective_blocker:
        effectiveVisibility &&
        !isCompleteStatus(practice.status) &&
        (practice.risk_level === 'High' || practice.risk_level === 'Critical'),
      effective_risk_visibility: effectiveVisibility,
      effective_poam_visibility: effectiveVisibility,
      is_customer_scored: isCustomerScored,
      is_shared_responsibility: isSharedResponsibility,
      is_fully_inherited: isFullyInherited,
      requires_validation: requiresValidation,
    }
  })
}
