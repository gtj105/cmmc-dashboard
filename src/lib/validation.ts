/**
 * validation.ts — Zod schemas for all API route inputs
 *
 * Usage in a route:
 *   import { parsePracticePatch } from '@/lib/validation'
 *   const result = parsePracticePatch(await req.json())
 *   if (!result.success) return validationError(result.error)
 */

import { z } from 'zod'
import { NextResponse } from 'next/server'

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Returns a 400 response with all Zod error messages joined. */
export function validationError(error: z.ZodError): NextResponse {
  const messages = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
  return NextResponse.json({ error: messages }, { status: 400 })
}

/** ISO date string (YYYY-MM-DD) or null/undefined. */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').nullable().optional()

// ─── Practices ────────────────────────────────────────────────────────────────

const VALID_STATUSES = ['Not Started', 'In Progress', 'Implemented', 'Audit Ready'] as const
const VALID_RISKS    = ['Low', 'Medium', 'High', 'Critical'] as const

export const PracticePatchSchema = z.object({
  status:          z.enum(VALID_STATUSES).optional(),
  risk_level:      z.enum(VALID_RISKS).optional(),
  evidence_exists: z.boolean().optional(),
  owner:           z.string().max(200).nullable().optional(),
  due_date:        isoDate,
  notes:           z.string().max(10_000).nullable().optional(),
}).refine(obj => Object.keys(obj).length > 0, { message: 'No fields to update' })

export type PracticePatch = z.infer<typeof PracticePatchSchema>

export function parsePracticePatch(body: unknown) {
  return PracticePatchSchema.safeParse(body)
}

// ─── Practice objectives ──────────────────────────────────────────────────────

const OBJECTIVE_STATUSES = ['met', 'partial', 'not_met', 'not_assessed'] as const

export const ObjectivePatchSchema = z.object({
  letter: z.string().regex(/^[a-zA-Z]$/, 'Must be a single letter'),
  status: z.enum(OBJECTIVE_STATUSES),
})

export function parseObjectivePatch(body: unknown) {
  return ObjectivePatchSchema.safeParse(body)
}

// ─── POAM ─────────────────────────────────────────────────────────────────────

const POAM_STATUSES = ['Open', 'In Progress', 'Closed'] as const

const poamText = z.string().max(5_000).nullable().optional()

const PoamBaseFields = {
  gap_statement:          z.string().min(1, 'gap_statement is required').max(5_000).optional(),
  root_cause:             poamText,
  remediation_plan:       poamText,
  closure_evidence:       poamText,
  practice_id:            z.string().max(20).nullable().optional(),
  responsible_individual: z.string().max(200).nullable().optional(),
  resources_required:     z.string().max(2_000).nullable().optional(),
  scheduled_completion:   isoDate,
  milestone_progress:     z.number().int().min(0).max(100).optional(),
  status:                 z.enum(POAM_STATUSES).optional(),
}

export const PoamCreateSchema = z.object({
  ...PoamBaseFields,
  gap_statement: z.string().min(1, 'gap_statement is required').max(5_000),
})

export const PoamPatchSchema = z.object(PoamBaseFields)
  .refine(obj => Object.keys(obj).filter(k => obj[k as keyof typeof obj] !== undefined).length > 0, {
    message: 'No fields to update',
  })

export function parsePoamCreate(body: unknown) {
  return PoamCreateSchema.safeParse(body)
}

export function parsePoamPatch(body: unknown) {
  return PoamPatchSchema.safeParse(body)
}

// ─── Users (admin) ────────────────────────────────────────────────────────────

const USER_ROLES = ['admin', 'editor', 'viewer'] as const

const PASSWORD_COMPLEXITY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]).{12,128}$/

export const UserCreateSchema = z.object({
  email:    z.string().email('Invalid email address').max(254),
  name:     z.string().min(1, 'Name is required').max(100),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(
      PASSWORD_COMPLEXITY,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  role:     z.enum(USER_ROLES),
})

export const UserRolePatchSchema = z.object({
  role: z.enum(USER_ROLES),
})

export function parseUserCreate(body: unknown) {
  return UserCreateSchema.safeParse(body)
}

export function parseUserRolePatch(body: unknown) {
  return UserRolePatchSchema.safeParse(body)
}

// ─── Password change ──────────────────────────────────────────────────────────

export const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(128),
  newPassword:     z.string()
    .min(12, 'New password must be at least 12 characters')
    .max(128, 'New password must be at most 128 characters')
    .regex(
      PASSWORD_COMPLEXITY,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
}).refine(d => d.currentPassword !== d.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
})

export function parsePasswordChange(body: unknown) {
  return PasswordChangeSchema.safeParse(body)
}

// ─── Factory reset ────────────────────────────────────────────────────────────

export const FactoryResetSchema = z.object({
  confirm_password: z.string().min(1, 'Password confirmation is required').max(128),
})

export function parseFactoryReset(body: unknown) {
  return FactoryResetSchema.safeParse(body)
}
