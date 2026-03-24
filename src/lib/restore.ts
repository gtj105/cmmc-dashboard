import sql from '@/lib/db'

/**
 * Shared restore logic used by both backup import and factory reset.
 *
 * Takes a validated backup payload and replaces all data in the database.
 * Runs inside a single transaction — either everything succeeds or nothing changes.
 */

export type RestorePayload = {
  users: Array<Record<string, unknown>>
  domains: Array<Record<string, unknown>>
  practices: Array<Record<string, unknown>>
  poam_items: Array<Record<string, unknown>>
  practice_history: Array<Record<string, unknown>>
  overlay_pack_states?: Array<{ key: string; enabled: boolean }>
  overlay_validations?: Array<Record<string, unknown>>
}

export function validatePayload(payload: unknown): asserts payload is RestorePayload {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid backup file')
  for (const key of ['users', 'domains', 'practices', 'poam_items', 'practice_history']) {
    if (!Array.isArray((payload as Record<string, unknown>)[key])) {
      throw new Error(`Backup file is missing required section: ${key}`)
    }
  }
}

export async function restoreFromPayload(parsed: RestorePayload): Promise<void> {
  await sql.begin(async (tx) => {
    const q = tx as unknown as typeof sql

    // Wipe existing data in dependency order
    await q`TRUNCATE practice_history, poam_items, practices, domains, users RESTART IDENTITY CASCADE`

    for (const user of parsed.users) {
      await q`
        INSERT INTO users (id, email, password_hash, name, role, created_at)
        VALUES (${user.id as number}, ${user.email as string}, ${user.password_hash as string},
                ${user.name as string}, ${(user.role as string) ?? 'viewer'}, ${user.created_at as string})
      `
    }
    for (const domain of parsed.domains) {
      await q`
        INSERT INTO domains (id, name, abbreviation, framework, description)
        VALUES (${domain.id as number}, ${domain.name as string}, ${domain.abbreviation as string},
                ${domain.framework as string}, ${domain.description as string})
      `
    }
    for (const practice of parsed.practices) {
      await q`
        INSERT INTO practices (id, domain_id, framework, practice_id, title, description, status,
                               risk_level, owner, due_date, evidence_exists, notes, created_at, updated_at)
        VALUES (
          ${practice.id as number}, ${practice.domain_id as number}, ${practice.framework as string},
          ${practice.practice_id as string}, ${practice.title as string}, ${practice.description as string},
          ${practice.status as string}, ${practice.risk_level as string},
          ${(practice.owner as string | null) ?? null}, ${(practice.due_date as string | null) ?? null},
          ${Boolean(practice.evidence_exists)}, ${(practice.notes as string | null) ?? null},
          ${practice.created_at as string}, ${practice.updated_at as string}
        )
      `
    }
    for (const item of parsed.poam_items) {
      await q`
        INSERT INTO poam_items (id, practice_id, finding, responsible_individual, resources_required,
                                scheduled_completion, milestone_progress, status, created_at, updated_at)
        VALUES (
          ${item.id as number}, ${(item.practice_id as string | null) ?? null}, ${item.finding as string},
          ${(item.responsible_individual as string | null) ?? null},
          ${(item.resources_required as string | null) ?? null},
          ${(item.scheduled_completion as string | null) ?? null},
          ${item.milestone_progress as number}, ${item.status as string},
          ${item.created_at as string}, ${item.updated_at as string}
        )
      `
    }
    for (const entry of parsed.practice_history) {
      await q`
        INSERT INTO practice_history (id, practice_id, field_changed, old_value, new_value, changed_by, changed_at)
        VALUES (
          ${entry.id as number}, ${entry.practice_id as string}, ${entry.field_changed as string},
          ${(entry.old_value as string | null) ?? null}, ${(entry.new_value as string | null) ?? null},
          ${entry.changed_by as string}, ${entry.changed_at as string}
        )
      `
    }

    // Reset sequences to max id in each table
    await q`SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1))`
    await q`SELECT setval('domains_id_seq', COALESCE((SELECT MAX(id) FROM domains), 1))`
    await q`SELECT setval('practices_id_seq', COALESCE((SELECT MAX(id) FROM practices), 1))`
    await q`SELECT setval('poam_items_id_seq', COALESCE((SELECT MAX(id) FROM poam_items), 1))`
    await q`SELECT setval('practice_history_id_seq', COALESCE((SELECT MAX(id) FROM practice_history), 1))`

    // Restore overlay pack enabled states
    if (parsed.overlay_pack_states?.length) {
      for (const pack of parsed.overlay_pack_states) {
        await q`UPDATE overlay_packs SET enabled = ${pack.enabled}, updated_at = NOW() WHERE key = ${pack.key}`
      }
    } else {
      await q`UPDATE overlay_packs SET enabled = false, updated_at = NOW()`
    }

    // Restore overlay validations
    await q`TRUNCATE overlay_validations RESTART IDENTITY CASCADE`
    for (const v of parsed.overlay_validations ?? []) {
      await q`
        INSERT INTO overlay_validations (id, overlay_mapping_id, validated, resolved_inheritance_type, validated_by, validated_at, validation_notes)
        VALUES (
          ${v.id as number}, ${v.overlay_mapping_id as number}, ${v.validated as boolean},
          ${(v.resolved_inheritance_type as string | null) ?? null},
          ${(v.validated_by as string | null) ?? null},
          ${(v.validated_at as string | null) ?? null},
          ${(v.validation_notes as string | null) ?? null}
        )
      `
    }
    if ((parsed.overlay_validations ?? []).length > 0) {
      await q`SELECT setval('overlay_validations_id_seq', COALESCE((SELECT MAX(id) FROM overlay_validations), 1))`
    }

    // Clear security events (audit log) — factory reset should start with a clean slate
    await q`TRUNCATE security_events RESTART IDENTITY`
  })
}
