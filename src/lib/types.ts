export type Status = 'Not Started' | 'In Progress' | 'Implemented' | 'Audit Ready'
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'
export type Framework = 'CMMC' | 'ITAR'

export const USER_ROLE_VALUES = ['viewer', 'editor', 'admin'] as const
export type UserRole = (typeof USER_ROLE_VALUES)[number]

export const OVERLAY_PACK_KEYS = ['m365_gcc_high', 'azure_government', 'microsoft_defender', 'microsoft_purview'] as const
export type OverlayPackKey = (typeof OVERLAY_PACK_KEYS)[number]

export const OVERLAY_PACK_STATUSES = ['available', 'not_loaded'] as const
export type OverlayPackStatus = (typeof OVERLAY_PACK_STATUSES)[number]

export const INHERITANCE_TYPES = ['full', 'partial', 'none', 'validation_required'] as const
export type InheritanceType = (typeof INHERITANCE_TYPES)[number]
export const RESOLVED_INHERITANCE_TYPES = ['full', 'partial', 'none'] as const
export type ResolvedInheritanceType = (typeof RESOLVED_INHERITANCE_TYPES)[number]

export interface OverlayPack {
  id: number
  key: OverlayPackKey
  name: string
  provider: string
  status: OverlayPackStatus
  enabled: boolean
  description: string
  created_at: string
  updated_at: string
}

export interface OverlayMapping {
  id: number
  overlay_pack_id: number
  practice_id: string
  inheritance_type: InheritanceType
  source_title: string
  source_url: string
  rationale: string
  customer_actions: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OverlayValidation {
  id: number
  overlay_mapping_id: number
  validated: boolean
  resolved_inheritance_type: ResolvedInheritanceType | null
  validated_by: string | null
  validated_at: string | null
  validation_notes: string | null
}

export interface Domain {
  id: number
  name: string
  abbreviation: string
  framework: Framework
  description: string
}

export interface Practice {
  id: number
  domain_id: number
  framework: Framework
  practice_id: string
  title: string
  description: string
  status: Status
  risk_level: RiskLevel
  sprs_weight: number
  owner: string | null
  due_date: string | null
  evidence_exists: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DomainWithStats extends Domain {
  total: number
  implemented: number
  audit_ready: number
  in_progress: number
  not_started: number
  completion_pct: number
}

export interface OverviewStats {
  total: number
  not_started: number
  in_progress: number
  implemented: number
  audit_ready: number
  score_pct: number
  itar_total: number
  itar_implemented: number
  itar_score_pct: number
  last_assessment_date: string | null
}

export type PoamStatus = 'Open' | 'In Progress' | 'Closed'

export interface PoamItem {
  id: number
  practice_id: string | null
  finding: string
  responsible_individual: string | null
  resources_required: string | null
  scheduled_completion: string | null
  milestone_progress: number
  status: PoamStatus
  created_at: string
  updated_at: string
}

export interface ActivityEntry {
  id: number
  practice_id: string
  field_changed: string
  old_value: string | null
  new_value: string | null
  changed_by: string
  changed_at: string
}

export interface EffectivePractice extends Practice {
  overlay_pack_key: OverlayPackKey | null
  overlay_pack_name: string | null
  inheritance_type: InheritanceType | null
  effective_inheritance_type: InheritanceType | null
  source_title: string | null
  source_url: string | null
  customer_actions: string | null
  effective_blocker: boolean
  effective_risk_visibility: boolean
  effective_poam_visibility: boolean
  is_customer_scored: boolean
  is_shared_responsibility: boolean
  is_fully_inherited: boolean
  requires_validation: boolean
}
