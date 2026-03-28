import { z } from 'zod'
import sql from '@/lib/db'

/**
 * Shared restore logic used by both backup import and factory reset.
 *
 * Takes a validated backup payload and replaces all data in the database.
 * Runs inside a single transaction — either everything succeeds or nothing changes.
 */

// ─── Row schemas ─────────────────────────────────────────────────────────────

const UserRowSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['viewer', 'editor', 'admin']).default('viewer'),
  created_at: z.string(),
  // password_hash intentionally excluded — never restored from backups
})

const DomainRowSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  abbreviation: z.string(),
  framework: z.string(),
  description: z.string(),
})

const PracticeRowSchema = z.object({
  id: z.number().int().positive(),
  domain_id: z.number().int().positive(),
  framework: z.string(),
  practice_id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  risk_level: z.string(),
  owner: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  evidence_exists: z.boolean().default(false),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

const PoamItemRowSchema = z.object({
  id: z.number().int().positive(),
  practice_id: z.string().nullable().optional(),
  finding: z.string(),
  responsible_individual: z.string().nullable().optional(),
  resources_required: z.string().nullable().optional(),
  scheduled_completion: z.string().nullable().optional(),
  milestone_progress: z.number().default(0),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

const PracticeHistoryRowSchema = z.object({
  id: z.number().int().positive(),
  practice_id: z.string(),
  field_changed: z.string(),
  old_value: z.string().nullable().optional(),
  new_value: z.string().nullable().optional(),
  changed_by: z.string(),
  changed_at: z.string(),
})

const OverlayPackStateSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
})

const OverlayValidationRowSchema = z.object({
  id: z.number().int().positive(),
  overlay_mapping_id: z.number().int().positive(),
  validated: z.boolean(),
  resolved_inheritance_type: z.string().nullable().optional(),
  validated_by: z.string().nullable().optional(),
  validated_at: z.string().nullable().optional(),
  validation_notes: z.string().nullable().optional(),
})

const RestorePayloadSchema = z.object({
  users: z.array(UserRowSchema),
  domains: z.array(DomainRowSchema),
  practices: z.array(PracticeRowSchema),
  poam_items: z.array(PoamItemRowSchema),
  practice_history: z.array(PracticeHistoryRowSchema),
  overlay_pack_states: z.array(OverlayPackStateSchema).optional(),
  overlay_validations: z.array(OverlayValidationRowSchema).optional(),
})

export type RestorePayload = z.infer<typeof RestorePayloadSchema>

// ─── Validation ───────────────────────────────────────────────────────────────

export function validatePayload(payload: unknown): asserts payload is RestorePayload {
  const result = RestorePayloadSchema.safeParse(payload)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    const path = firstIssue.path.join('.')
    throw new Error(`Invalid backup file: ${path ? path + ': ' : ''}${firstIssue.message}`)
  }
}

// ─── Restore ──────────────────────────────────────────────────────────────────

export async function restoreFromPayload(parsed: RestorePayload): Promise<void> {
  await sql.begin(async (tx) => {
    const q = tx as unknown as typeof sql

    // Wipe existing data in dependency order
    await q`TRUNCATE practice_history, poam_items, practices, domains, users RESTART IDENTITY CASCADE`

    // Always use a locked hash — never restore password_hash from backup files.
    // Restored users must set a new password on first login.
    const LOCKED_HASH = '$2b$10$lockedXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    for (const user of parsed.users) {
      await q`
        INSERT INTO users (id, email, password_hash, name, role, must_change_password, created_at)
        VALUES (${user.id}, ${user.email}, ${LOCKED_HASH},
                ${user.name}, ${user.role},
                ${true}, ${user.created_at})
      `
    }
    for (const domain of parsed.domains) {
      await q`
        INSERT INTO domains (id, name, abbreviation, framework, description)
        VALUES (${domain.id}, ${domain.name}, ${domain.abbreviation},
                ${domain.framework}, ${domain.description})
      `
    }
    for (const practice of parsed.practices) {
      await q`
        INSERT INTO practices (id, domain_id, framework, practice_id, title, description, status,
                               risk_level, owner, due_date, evidence_exists, notes, created_at, updated_at)
        VALUES (
          ${practice.id}, ${practice.domain_id}, ${practice.framework},
          ${practice.practice_id}, ${practice.title}, ${practice.description},
          ${practice.status}, ${practice.risk_level},
          ${practice.owner ?? null}, ${practice.due_date ?? null},
          ${Boolean(practice.evidence_exists)}, ${practice.notes ?? null},
          ${practice.created_at}, ${practice.updated_at}
        )
      `
    }
    for (const item of parsed.poam_items) {
      await q`
        INSERT INTO poam_items (id, practice_id, finding, responsible_individual, resources_required,
                                scheduled_completion, milestone_progress, status, created_at, updated_at)
        VALUES (
          ${item.id}, ${item.practice_id ?? null}, ${item.finding},
          ${item.responsible_individual ?? null},
          ${item.resources_required ?? null},
          ${item.scheduled_completion ?? null},
          ${item.milestone_progress}, ${item.status},
          ${item.created_at}, ${item.updated_at}
        )
      `
    }
    for (const entry of parsed.practice_history) {
      await q`
        INSERT INTO practice_history (id, practice_id, field_changed, old_value, new_value, changed_by, changed_at)
        VALUES (
          ${entry.id}, ${entry.practice_id}, ${entry.field_changed},
          ${entry.old_value ?? null}, ${entry.new_value ?? null},
          ${entry.changed_by}, ${entry.changed_at}
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
          ${v.id}, ${v.overlay_mapping_id}, ${v.validated},
          ${v.resolved_inheritance_type ?? null},
          ${v.validated_by ?? null},
          ${v.validated_at ?? null},
          ${v.validation_notes ?? null}
        )
      `
    }
    if ((parsed.overlay_validations ?? []).length > 0) {
      await q`SELECT setval('overlay_validations_id_seq', COALESCE((SELECT MAX(id) FROM overlay_validations), 1))`
    }

    // NOTE: security_events (audit log) is NOT truncated here.
    // Factory reset truncates it explicitly in the factory-reset route.
    // Normal backup imports preserve the audit trail.
  })
}
