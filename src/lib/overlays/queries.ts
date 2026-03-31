import type {
  Framework,
  InheritanceType,
  OverlayMapping,
  OverlayPack,
  OverlayPackKey,
  OverlayValidation,
  Practice,
} from '@/lib/types'
import { buildEffectivePractices } from './resolution'

import type sql from '@/lib/db'
export type QueryClient = typeof sql

export interface OverlayPackSummary extends OverlayPack {
  impacted_count: number
  full_count: number
  partial_count: number
  none_count: number
  validation_required_count: number
}

export interface OverlayMappingDetail extends OverlayMapping {
  practice_title: string | null
  practice_framework: Practice['framework'] | null
  practice_status: Practice['status'] | null
  practice_risk_level: Practice['risk_level'] | null
  domain_abbreviation: string | null
  validated: boolean | null
  resolved_inheritance_type: InheritanceType | null
  validation_notes: string | null
}

interface EffectivePracticeQueryOptions {
  framework?: Framework
  domainId?: number
}

export async function fetchOverlayPacks(sql: QueryClient): Promise<OverlayPack[]> {
  return (await sql`
    SELECT
      id,
      key,
      name,
      provider,
      status,
      enabled,
      description,
      created_at::text AS created_at,
      updated_at::text AS updated_at
    FROM overlay_packs
    ORDER BY key
  `) as OverlayPack[]
}

export async function fetchActiveOverlayPacks(sql: QueryClient): Promise<OverlayPack[]> {
  return (await sql`
    SELECT
      id,
      key,
      name,
      provider,
      status,
      enabled,
      description,
      created_at::text AS created_at,
      updated_at::text AS updated_at
    FROM overlay_packs
    WHERE enabled = TRUE
      AND status = 'available'
    ORDER BY key
  `) as OverlayPack[]
}

export async function fetchOverlayPackSummaries(sql: QueryClient): Promise<OverlayPackSummary[]> {
  return (await sql`
    SELECT
      p.id,
      p.key,
      p.name,
      p.provider,
      p.status,
      p.enabled,
      p.description,
      p.created_at::text AS created_at,
      p.updated_at::text AS updated_at,
      COUNT(m.id) FILTER (WHERE m.inheritance_type <> 'none')::int AS impacted_count,
      COUNT(m.id) FILTER (WHERE m.inheritance_type = 'full')::int AS full_count,
      COUNT(m.id) FILTER (WHERE m.inheritance_type = 'partial')::int AS partial_count,
      COUNT(m.id) FILTER (WHERE m.inheritance_type = 'none')::int AS none_count,
      COUNT(m.id) FILTER (WHERE m.inheritance_type = 'validation_required')::int AS validation_required_count
    FROM overlay_packs p
    LEFT JOIN overlay_mappings m ON m.overlay_pack_id = p.id
    GROUP BY p.id
    ORDER BY p.key
  `) as OverlayPackSummary[]
}

export async function fetchOverlayPackByKey(
  sql: QueryClient,
  key: OverlayPackKey,
): Promise<OverlayPackSummary | null> {
  const [pack] = await sql`
    SELECT
      p.id,
      p.key,
      p.name,
      p.provider,
      p.status,
      p.enabled,
      p.description,
      p.created_at::text AS created_at,
      p.updated_at::text AS updated_at,
      COUNT(m.id) FILTER (WHERE m.inheritance_type <> 'none')::int AS impacted_count,
      COUNT(m.id) FILTER (WHERE m.inheritance_type = 'full')::int AS full_count,
      COUNT(m.id) FILTER (WHERE m.inheritance_type = 'partial')::int AS partial_count,
      COUNT(m.id) FILTER (WHERE m.inheritance_type = 'none')::int AS none_count,
      COUNT(m.id) FILTER (WHERE m.inheritance_type = 'validation_required')::int AS validation_required_count
    FROM overlay_packs p
    LEFT JOIN overlay_mappings m ON m.overlay_pack_id = p.id
    WHERE p.key = ${key}
    GROUP BY p.id
    LIMIT 1
  `

  return (pack as unknown as OverlayPackSummary | undefined) ?? null
}

export async function fetchOverlayMappingsForPack(
  sql: QueryClient,
  key: OverlayPackKey,
): Promise<OverlayMappingDetail[]> {
  const pack = await fetchOverlayPackByKey(sql, key)
  if (!pack) return []
  if (pack.status !== 'available') return []

  return (await sql`
    SELECT
      m.id,
      m.overlay_pack_id,
      m.practice_id,
      m.inheritance_type,
      m.source_title,
      m.source_url,
      m.rationale,
      m.customer_actions,
      m.notes,
      m.created_at::text AS created_at,
      m.updated_at::text AS updated_at,
      p.title AS practice_title,
      p.framework AS practice_framework,
      p.status AS practice_status,
      p.risk_level AS practice_risk_level,
      d.abbreviation AS domain_abbreviation,
      v.validated,
      v.resolved_inheritance_type,
      v.validation_notes
    FROM overlay_mappings m
    JOIN overlay_packs op ON op.id = m.overlay_pack_id
    LEFT JOIN practices p ON p.practice_id = m.practice_id
    LEFT JOIN domains d ON d.id = p.domain_id
    LEFT JOIN overlay_validations v ON v.overlay_mapping_id = m.id
    WHERE op.key = ${key}
      AND m.inheritance_type <> 'none'
    ORDER BY m.practice_id
  `) as OverlayMappingDetail[]
}

export async function fetchOverlayValidationsForActivePacks(
  sql: QueryClient,
  activePacks?: Pick<OverlayPack, 'id'>[],
): Promise<OverlayValidation[]> {
  const packs = activePacks ?? await fetchActiveOverlayPacks(sql)
  if (packs.length === 0) return []

  const activePackIds = packs.map((pack) => pack.id)

  return (await sql`
    SELECT
      v.id,
      v.overlay_mapping_id,
      v.validated,
      v.resolved_inheritance_type,
      v.validated_by,
      v.validated_at::text AS validated_at,
      v.validation_notes
    FROM overlay_validations v
    JOIN overlay_mappings m ON m.id = v.overlay_mapping_id
    WHERE m.overlay_pack_id = ANY(${activePackIds})
    ORDER BY v.overlay_mapping_id
  `) as OverlayValidation[]
}

export async function toggleOverlayPackEnabled(
  sql: QueryClient,
  key: OverlayPackKey,
  enabled: boolean,
): Promise<OverlayPackSummary | null> {
  const [pack] = await sql`
    UPDATE overlay_packs
    SET enabled = ${enabled}, updated_at = NOW()
    WHERE key = ${key}
    RETURNING
      id,
      key,
      name,
      provider,
      status,
      enabled,
      description,
      created_at::text AS created_at,
      updated_at::text AS updated_at
  `

  if (!pack) return null

  const [summary] = await sql`
    SELECT
      p.id,
      p.key,
      p.name,
      p.provider,
      p.status,
      p.enabled,
      p.description,
      p.created_at::text AS created_at,
      p.updated_at::text AS updated_at,
      COUNT(m.id) FILTER (WHERE m.inheritance_type <> 'none')::int AS impacted_count,
      COUNT(m.id) FILTER (WHERE m.inheritance_type = 'full')::int AS full_count,
      COUNT(m.id) FILTER (WHERE m.inheritance_type = 'partial')::int AS partial_count,
      COUNT(m.id) FILTER (WHERE m.inheritance_type = 'none')::int AS none_count,
      COUNT(m.id) FILTER (WHERE m.inheritance_type = 'validation_required')::int AS validation_required_count
    FROM overlay_packs p
    LEFT JOIN overlay_mappings m ON m.overlay_pack_id = p.id
    WHERE p.key = ${key}
    GROUP BY p.id
    LIMIT 1
  `

  return (summary as unknown as OverlayPackSummary | undefined) ?? null
}

export async function fetchMappingsForActivePacks(
  sql: QueryClient,
  activePacks?: Pick<OverlayPack, 'id'>[],
): Promise<OverlayMapping[]> {
  const packs = activePacks ?? await fetchActiveOverlayPacks(sql)
  if (packs.length === 0) return []

  const activePackIds = packs.map((pack) => pack.id)

  return (await sql`
    SELECT
      id,
      overlay_pack_id,
      practice_id,
      inheritance_type,
      source_title,
      source_url,
      rationale,
      customer_actions,
      notes,
      created_at::text AS created_at,
      updated_at::text AS updated_at
    FROM overlay_mappings
    WHERE overlay_pack_id = ANY(${activePackIds})
    ORDER BY overlay_pack_id, practice_id
  `) as OverlayMapping[]
}

async function fetchPracticesForEffectiveView(
  sql: QueryClient,
  options: EffectivePracticeQueryOptions,
): Promise<Practice[]> {
  if (options.domainId !== undefined) {
    return (await sql<Practice[]>`
      SELECT * FROM practices WHERE domain_id = ${options.domainId} ORDER BY practice_id
    `) as Practice[]
  }

  if (options.framework) {
    return (await sql<Practice[]>`
      SELECT * FROM practices WHERE framework = ${options.framework} ORDER BY practice_id
    `) as Practice[]
  }

  return (await sql<Practice[]>`
    SELECT * FROM practices ORDER BY practice_id
  `) as Practice[]
}

export async function fetchEffectivePractices(
  sql: QueryClient,
  options: EffectivePracticeQueryOptions = {},
): Promise<{
  baselinePractices: Practice[]
  effectivePractices: ReturnType<typeof buildEffectivePractices>
  activePacks: OverlayPack[]
}> {
  const [baselinePractices, activePacks] = await Promise.all([
    fetchPracticesForEffectiveView(sql, options),
    fetchActiveOverlayPacks(sql),
  ])

  const [mappings, validations] = await Promise.all([
    fetchMappingsForActivePacks(sql, activePacks),
    fetchOverlayValidationsForActivePacks(sql, activePacks),
  ])

  return {
    baselinePractices,
    effectivePractices: buildEffectivePractices(baselinePractices, mappings, activePacks, validations),
    activePacks,
  }
}
