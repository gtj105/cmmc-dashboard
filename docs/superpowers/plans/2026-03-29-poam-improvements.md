# POAM Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single `finding` field with four structured text fields, add soft-delete (archive/restore), write per-field change history, and add an "Add POA&M" button to the practice evidence drawer.

**Architecture:** New `poam_history` table (mirrors `practice_history`). `poam_items` gains 4 structured columns (`gap_statement`, `root_cause`, `remediation_plan`, `closure_evidence`) replacing `finding`, plus `deleted_at` for soft-delete. API and UI updated throughout. No new lib files — changes stay in the files they logically belong to.

**Tech Stack:** PostgreSQL, Next.js 14 App Router, TypeScript, Zod, React, Tailwind CSS

---

## File Map

| Action | File |
|---|---|
| Create | `scripts/migrations/007-poam-improvements.sql` |
| Create | `src/app/api/poam/[id]/history/route.ts` |
| Create | `src/app/api/poam/[id]/restore/route.ts` |
| Modify | `src/lib/types.ts` |
| Modify | `src/lib/validation.ts` |
| Modify | `src/app/api/poam/route.ts` |
| Modify | `src/app/api/poam/[id]/route.ts` |
| Modify | `src/app/poam/poam-page-data.ts` |
| Modify | `src/app/poam/page.tsx` |
| Modify | `src/app/poam/PoamTable.tsx` |
| Modify | `src/components/EvidenceDrawer.tsx` |

---

## Task 1: Database Migration

**Files:**
- Create: `scripts/migrations/007-poam-improvements.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 007-poam-improvements.sql
-- Structured POAM fields + soft-delete + change history

-- 1. Add new structured columns (nullable so existing rows are unaffected)
ALTER TABLE poam_items
  ADD COLUMN IF NOT EXISTS gap_statement    TEXT,
  ADD COLUMN IF NOT EXISTS root_cause       TEXT,
  ADD COLUMN IF NOT EXISTS remediation_plan TEXT,
  ADD COLUMN IF NOT EXISTS closure_evidence TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at       TIMESTAMPTZ;

-- 2. Migrate existing finding content → gap_statement
UPDATE poam_items
SET gap_statement = finding
WHERE gap_statement IS NULL;

-- 3. Enforce NOT NULL on gap_statement now that all rows are populated
ALTER TABLE poam_items
  ALTER COLUMN gap_statement SET NOT NULL;

-- 4. Drop the old finding column
ALTER TABLE poam_items
  DROP COLUMN IF EXISTS finding;

-- 5. Create the change-history table
CREATE TABLE IF NOT EXISTS poam_history (
  id            SERIAL PRIMARY KEY,
  poam_id       INTEGER NOT NULL REFERENCES poam_items(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  old_value     TEXT,
  new_value     TEXT,
  changed_by    TEXT NOT NULL,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS poam_history_poam_id_idx ON poam_history (poam_id);
```

- [ ] **Step 2: Verify migration runs cleanly**

Start (or restart) dev stack so `instrumentation.ts` runs migrations:

```bash
docker compose -f docker-compose.dev.yml restart app
docker compose -f docker-compose.dev.yml logs app | grep -E "migration|007"
```

Expected output includes: `[migrations] applied 007-poam-improvements.sql`

Verify schema in DB:
```bash
docker compose -f docker-compose.dev.yml exec db psql -U cmmc_user cmmc_db -c "\d poam_items"
```
Expected: columns `gap_statement NOT NULL`, `deleted_at`, no `finding` column.

```bash
docker compose -f docker-compose.dev.yml exec db psql -U cmmc_user cmmc_db -c "\d poam_history"
```
Expected: `poam_history` table with `poam_id`, `field_changed`, `old_value`, `new_value`, `changed_by`, `changed_at`.

- [ ] **Step 3: Commit**

```bash
git add scripts/migrations/007-poam-improvements.sql
git commit -m "feat: migration 007 — structured POAM fields, soft-delete, history table"
```

---

## Task 2: Types and Validation

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/validation.ts`

- [ ] **Step 1: Update `PoamItem` interface and add `PoamHistoryEntry` in `types.ts`**

Replace the existing `PoamItem` interface (lines 106–117):

```typescript
export type PoamStatus = 'Open' | 'In Progress' | 'Closed'

export interface PoamItem {
  id: number
  practice_id: string | null
  gap_statement: string
  root_cause: string | null
  remediation_plan: string | null
  closure_evidence: string | null
  responsible_individual: string | null
  resources_required: string | null
  scheduled_completion: string | null
  milestone_progress: number
  status: PoamStatus
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface PoamHistoryEntry {
  id: number
  poam_id: number
  field_changed: string
  old_value: string | null
  new_value: string | null
  changed_by: string
  changed_at: string
}
```

- [ ] **Step 2: Update POAM schemas in `validation.ts`**

Replace the POAM section (lines 58–88):

```typescript
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /path/to/repo && npx tsc --noEmit 2>&1 | grep -E "error|warning" | head -20
```

Expected: zero errors (or only pre-existing ones unrelated to POAM).

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/validation.ts
git commit -m "feat: update PoamItem type and validation for structured fields"
```

---

## Task 3: API — POST /api/poam (create)

**Files:**
- Modify: `src/app/api/poam/route.ts`

- [ ] **Step 1: Replace the POST handler**

Full file replacement:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import { requireRole } from '@/lib/auth'
import { checkCsrf } from '@/lib/api-csrf'
import sql from '@/lib/db'
import { parsePoamCreate, validationError } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const csrfError = checkCsrf(req)
  if (csrfError) return csrfError

  const session = await getAuthSession()
  const authError = requireRole(session, 'editor')
  if (authError) return authError

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = parsePoamCreate(rawBody)
  if (!parsed.success) return validationError(parsed.error)
  const {
    gap_statement,
    root_cause,
    remediation_plan,
    closure_evidence,
    practice_id,
    responsible_individual,
    resources_required,
    scheduled_completion,
    milestone_progress,
    status,
  } = parsed.data

  try {
    const [created] = await sql`
      INSERT INTO poam_items (
        gap_statement, root_cause, remediation_plan, closure_evidence,
        practice_id, responsible_individual, resources_required,
        scheduled_completion, milestone_progress, status
      )
      VALUES (
        ${gap_statement.trim()},
        ${root_cause ?? null},
        ${remediation_plan ?? null},
        ${closure_evidence ?? null},
        ${practice_id ?? null},
        ${responsible_individual ?? null},
        ${resources_required ?? null},
        ${scheduled_completion ?? null},
        ${milestone_progress ?? 0},
        ${status ?? 'Open'}
      )
      RETURNING *
    `
    return NextResponse.json(created, { status: 201 })
  } catch (err: unknown) {
    const pgErr = err as { code?: string }
    if (pgErr?.code === '23503') {
      return NextResponse.json({ error: 'Invalid practice_id — practice not found' }, { status: 400 })
    }
    throw err
  }
}
```

- [ ] **Step 2: Manual smoke test**

Start dev server. In browser dev tools or via curl, POST to `/api/poam`:

```bash
# Get CSRF token from cookie first, then:
curl -X POST http://localhost:3001/api/poam \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: <token>" \
  -H "Cookie: <session+csrf cookies>" \
  -d '{"gap_statement":"Test gap","status":"Open"}'
```

Expected: `201` with JSON including `gap_statement`, no `finding` field.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/poam/route.ts
git commit -m "feat: POST /api/poam accepts structured fields"
```

---

## Task 4: API — PATCH + Soft-Delete + History

**Files:**
- Modify: `src/app/api/poam/[id]/route.ts`

- [ ] **Step 1: Replace the full route file**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import { requireRole } from '@/lib/auth'
import { checkCsrf } from '@/lib/api-csrf'
import sql from '@/lib/db'
import { parsePoamPatch, validationError } from '@/lib/validation'

export const dynamic = 'force-dynamic'

// Fields we track in history (excludes milestone_progress for brevity — add if needed)
const TRACKED_FIELDS = [
  'gap_statement', 'root_cause', 'remediation_plan', 'closure_evidence',
  'responsible_individual', 'resources_required', 'scheduled_completion',
  'milestone_progress', 'status',
] as const

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrfError = checkCsrf(req)
  if (csrfError) return csrfError

  const session = await getAuthSession()
  const authError = requireRole(session, 'editor')
  if (authError) return authError

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = parsePoamPatch(rawBody)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const body = rawBody as Record<string, unknown>
  const updates: Record<string, unknown> = {}
  const ALLOWED_UPDATE_KEYS = [
    'gap_statement', 'root_cause', 'remediation_plan', 'closure_evidence',
    'practice_id', 'responsible_individual', 'resources_required',
    'scheduled_completion', 'milestone_progress', 'status',
  ]
  for (const key of ALLOWED_UPDATE_KEYS) {
    if (key in body) updates[key] = data[key as keyof typeof data]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // Fetch current row to diff for history
  const [before] = await sql`SELECT * FROM poam_items WHERE id = ${id} AND deleted_at IS NULL`
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let updated: Record<string, unknown> | undefined
  try {
    const [result] = await sql`
      UPDATE poam_items
      SET ${sql(updates)}, updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING *
    `
    updated = result
  } catch (err: unknown) {
    const pgErr = err as { code?: string }
    if (pgErr?.code === '23503') {
      return NextResponse.json({ error: 'Invalid practice_id — practice not found' }, { status: 400 })
    }
    throw err
  }
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Write one history row per changed tracked field
  const changedBy = session!.user.email ?? session!.user.name ?? 'unknown'
  const historyRows = TRACKED_FIELDS
    .filter(field => field in updates)
    .filter(field => String(before[field] ?? '') !== String(updates[field] ?? ''))
    .map(field => ({
      poam_id: id,
      field_changed: field,
      old_value: before[field] != null ? String(before[field]) : null,
      new_value: updates[field] != null ? String(updates[field]) : null,
      changed_by: changedBy,
    }))

  if (historyRows.length > 0) {
    await sql`INSERT INTO poam_history ${sql(historyRows)}`
  }

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrfError = checkCsrf(_req)
  if (csrfError) return csrfError

  const session = await getAuthSession()
  const authError = requireRole(session, 'admin')
  if (authError) return authError

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const [archived] = await sql`
    UPDATE poam_items
    SET deleted_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING *
  `
  if (!archived) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(archived)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "error" | head -10
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/poam/[id]/route.ts
git commit -m "feat: PATCH writes history rows, DELETE is now soft-delete"
```

---

## Task 5: New API Routes — Restore and History

**Files:**
- Create: `src/app/api/poam/[id]/restore/route.ts`
- Create: `src/app/api/poam/[id]/history/route.ts`

- [ ] **Step 1: Create restore route**

`src/app/api/poam/[id]/restore/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import { requireRole } from '@/lib/auth'
import { checkCsrf } from '@/lib/api-csrf'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrfError = checkCsrf(req)
  if (csrfError) return csrfError

  const session = await getAuthSession()
  const authError = requireRole(session, 'admin')
  if (authError) return authError

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const [restored] = await sql`
    UPDATE poam_items
    SET deleted_at = NULL
    WHERE id = ${id} AND deleted_at IS NOT NULL
    RETURNING *
  `
  if (!restored) return NextResponse.json({ error: 'Not found or not archived' }, { status: 404 })
  return NextResponse.json(restored)
}
```

- [ ] **Step 2: Create history route**

`src/app/api/poam/[id]/history/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import { requireRole } from '@/lib/auth'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession()
  const authError = requireRole(session, 'viewer')
  if (authError) return authError

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const rows = await sql`
    SELECT * FROM poam_history
    WHERE poam_id = ${id}
    ORDER BY changed_at DESC
  `
  return NextResponse.json(rows)
}
```

- [ ] **Step 3: Verify both files compile**

```bash
npx tsc --noEmit 2>&1 | grep "error" | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/poam/[id]/restore/route.ts src/app/api/poam/[id]/history/route.ts
git commit -m "feat: add restore and history API routes for POAM items"
```

---

## Task 6: Update poam-page-data.ts

**Files:**
- Modify: `src/app/poam/poam-page-data.ts`

- [ ] **Step 1: Replace the file**

Full replacement (remove `FINDING_TEMPLATE`, update `PoamFormState`):

```typescript
import type { PoamItem, PoamStatus } from '@/lib/types'

export const STATUS_COLORS: Record<PoamStatus, string> = {
  Open: 'text-red-300 bg-red-950/30 border-red-900/70',
  'In Progress': 'text-amber-300 bg-amber-950/30 border-amber-900/70',
  Closed: 'text-green-300 bg-green-950/30 border-green-900/70',
}

export const STATUSES: PoamStatus[] = ['Open', 'In Progress', 'Closed']

export type PoamFormState = {
  gapStatement: string
  rootCause: string
  remediationPlan: string
  closureEvidence: string
  practiceId: string
  owner: string
  resources: string
  date: string
}

export function createEmptyPoamForm(practiceId = ''): PoamFormState {
  return {
    gapStatement: '',
    rootCause: '',
    remediationPlan: '',
    closureEvidence: '',
    practiceId,
    owner: '',
    resources: '',
    date: '',
  }
}

export function scopePoamItems(
  items: PoamItem[],
  overlayActive: boolean,
  customerOwnedPracticeIds: Set<string> | null,
): PoamItem[] {
  return items.filter((item) => {
    if (!overlayActive || customerOwnedPracticeIds === null) return true
    if (!item.practice_id) return true
    return customerOwnedPracticeIds.has(item.practice_id)
  })
}

export function filterPoamItems(items: PoamItem[], statusFilter: string): PoamItem[] {
  return items.filter((item) => statusFilter === 'all' || item.status === statusFilter)
}

export function buildPoamSummary(items: PoamItem[]) {
  return {
    openCount: items.filter((item) => item.status === 'Open').length,
    inProgressCount: items.filter((item) => item.status === 'In Progress').length,
    closedCount: items.filter((item) => item.status === 'Closed').length,
  }
}

export function formatScheduledCompletion(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | grep "error" | head -20
```

TypeScript will now report errors in `PoamTable.tsx` because it still references the old `finding` field and old form shape — that's expected and will be fixed in Task 8.

- [ ] **Step 3: Commit**

```bash
git add src/app/poam/poam-page-data.ts
git commit -m "feat: update PoamFormState to structured fields, remove FINDING_TEMPLATE"
```

---

## Task 7: Update page.tsx — Filter Archived Items

**Files:**
- Modify: `src/app/poam/page.tsx`

- [ ] **Step 1: Update the server query and pass `isAdmin` prop**

Replace the SQL query and `PoamTable` call:

```typescript
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import sql from '@/lib/db'
import AppShell from '@/components/layout/AppShell'
import { getOrgName } from '@/lib/settings'
import { fetchEffectivePractices } from '@/lib/overlays'
import type { PoamItem } from '@/lib/types'
import { scopePoamItems } from './poam-page-data'
import { PoamTable } from './PoamTable'

export const dynamic = 'force-dynamic'

export default async function PoamPage() {
  const session = await getServerSession(getAuthOptions())
  if (!session) redirect('/login')

  const orgName = await getOrgName()
  const canEdit = session.user.role === 'editor' || session.user.role === 'admin'
  const isAdmin = session.user.role === 'admin'

  const [items, { effectivePractices, activePacks }] = await Promise.all([
    sql<PoamItem[]>`
      SELECT * FROM poam_items
      WHERE deleted_at IS NULL
      ORDER BY
        CASE status WHEN 'Open' THEN 1 WHEN 'In Progress' THEN 2 ELSE 3 END,
        scheduled_completion ASC NULLS LAST,
        created_at DESC
    `,
    fetchEffectivePractices(sql),
  ])

  const overlayActive = activePacks.length > 0
  const customerOwnedPracticeIds = overlayActive
    ? new Set(effectivePractices.filter((p) => p.effective_poam_visibility).map((p) => p.practice_id))
    : null

  const scopedItems = scopePoamItems(items, overlayActive, customerOwnedPracticeIds)

  return (
    <AppShell orgName={orgName}>
      <div className="space-y-8">
        <PoamTable initialItems={scopedItems} canEdit={canEdit} isAdmin={isAdmin} />
      </div>
    </AppShell>
  )
}
```

Note: `canDelete` is removed from props — archive permission is now tied to `isAdmin` inside `PoamTable`.

- [ ] **Step 2: Commit**

```bash
git add src/app/poam/page.tsx
git commit -m "feat: filter archived POAM items from default view, pass isAdmin to PoamTable"
```

---

## Task 8: PoamTable.tsx — Full Rewrite

**Files:**
- Modify: `src/app/poam/PoamTable.tsx`

This is the largest task. The component gains: structured form (4 textareas), archive button with inline confirmation, "Show archived" toggle (admin only), restore button for archived rows, and a lazy-loaded history panel per row.

- [ ] **Step 1: Write the complete new PoamTable.tsx**

```typescript
'use client'

import React, { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { PracticePicker } from '@/components/ui/practice-picker'
import type { PoamItem, PoamHistoryEntry, PoamStatus } from '@/lib/types'
import {
  buildPoamSummary,
  createEmptyPoamForm,
  filterPoamItems,
  formatScheduledCompletion,
  STATUSES,
  STATUS_COLORS,
  type PoamFormState,
} from './poam-page-data'

interface PoamTableProps {
  initialItems: PoamItem[]
  canEdit: boolean
  isAdmin: boolean
}

// ── Textarea helper ────────────────────────────────────────────────────────────

function FieldTextarea({
  label,
  required,
  value,
  onChange,
  hint,
  rows = 4,
}: {
  label: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  hint?: string
  rows?: number
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
        {label}{required && <span className="ml-1 text-red-400">*</span>}
      </label>
      <textarea
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={5000}
        className="w-full resize-y border border-border/70 bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {hint && <p className="text-[10px] text-amber-400/80">{hint}</p>}
    </div>
  )
}

// ── POAM form fields (reused by create + edit) ─────────────────────────────────

function PoamFormFields({
  form,
  onChange,
  isClosing,
}: {
  form: PoamFormState
  onChange: (patch: Partial<PoamFormState>) => void
  isClosing: boolean
}) {
  return (
    <div className="space-y-3">
      <FieldTextarea
        label="Gap Statement"
        required
        value={form.gapStatement}
        onChange={(v) => onChange({ gapStatement: v })}
        rows={5}
      />
      <FieldTextarea
        label="Root Cause"
        value={form.rootCause}
        onChange={(v) => onChange({ rootCause: v })}
      />
      <FieldTextarea
        label="Remediation Plan"
        value={form.remediationPlan}
        onChange={(v) => onChange({ remediationPlan: v })}
        hint={isClosing ? 'Required to close' : undefined}
      />
      <FieldTextarea
        label="Closure Evidence"
        value={form.closureEvidence}
        onChange={(v) => onChange({ closureEvidence: v })}
        hint={isClosing ? 'Required to close' : undefined}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <PracticePicker
          value={form.practiceId}
          onChange={(v) => onChange({ practiceId: v })}
        />
        <input
          type="text"
          placeholder="Responsible individual"
          value={form.owner}
          maxLength={100}
          onChange={(e) => onChange({ owner: e.target.value })}
          className="border border-border/70 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="text"
          placeholder="Resources required"
          value={form.resources}
          maxLength={500}
          onChange={(e) => onChange({ resources: e.target.value })}
          className="border border-border/70 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <DatePicker
          value={form.date}
          onChange={(v) => onChange({ date: v })}
        />
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PoamTable({ initialItems, canEdit, isAdmin }: PoamTableProps) {
  const [items, setItems] = useState<PoamItem[]>(initialItems)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<PoamFormState>(createEmptyPoamForm())
  const [editSaving, setEditSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<PoamFormState>(createEmptyPoamForm())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Archive state
  const [archiveConfirmId, setArchiveConfirmId] = useState<number | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [archivedItems, setArchivedItems] = useState<PoamItem[]>([])
  const [archivedLoading, setArchivedLoading] = useState(false)

  // History state
  const [historyExpandedIds, setHistoryExpandedIds] = useState<Set<number>>(new Set())
  const [historyData, setHistoryData] = useState<Record<number, PoamHistoryEntry[]>>({})
  const [historyLoading, setHistoryLoading] = useState<Set<number>>(new Set())

  const filteredItems = useMemo(() => filterPoamItems(items, statusFilter), [items, statusFilter])
  const summary = useMemo(() => buildPoamSummary(items), [items])

  const showError = useCallback((msg: string) => {
    setSaveError(msg)
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    dismissTimer.current = setTimeout(() => setSaveError(null), 5000)
  }, [])

  useEffect(() => () => { if (dismissTimer.current) clearTimeout(dismissTimer.current) }, [])

  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function startEdit(item: PoamItem) {
    setEditingId(item.id)
    setEditForm({
      gapStatement: item.gap_statement,
      rootCause: item.root_cause ?? '',
      remediationPlan: item.remediation_plan ?? '',
      closureEvidence: item.closure_evidence ?? '',
      practiceId: item.practice_id ?? '',
      owner: item.responsible_individual ?? '',
      resources: item.resources_required ?? '',
      date: item.scheduled_completion ? new Date(item.scheduled_completion).toISOString().slice(0, 10) : '',
    })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId || !editForm.gapStatement.trim()) return
    setEditSaving(true)
    try {
      const res = await apiFetch(`/api/poam/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gap_statement: editForm.gapStatement,
          root_cause: editForm.rootCause || null,
          remediation_plan: editForm.remediationPlan || null,
          closure_evidence: editForm.closureEvidence || null,
          practice_id: editForm.practiceId || null,
          responsible_individual: editForm.owner || null,
          resources_required: editForm.resources || null,
          scheduled_completion: editForm.date || null,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setItems((prev) => prev.map((item) => (item.id === editingId ? updated : item)))
        setEditingId(null)
        // Invalidate cached history for this item
        setHistoryData((prev) => { const n = { ...prev }; delete n[editingId]; return n })
      } else {
        showError('Failed to save changes.')
      }
    } catch {
      showError('Network error — changes were not saved.')
    }
    setEditSaving(false)
  }

  async function handleStatusChange(id: number, newStatus: PoamStatus) {
    if (!canEdit) return
    const previous = items.find((i) => i.id === id)?.status
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)))
    try {
      const res = await apiFetch(`/api/poam/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: previous! } : item)))
        showError(res.status === 401 ? 'Session expired — please refresh.' : 'Failed to update status. Change reverted.')
      } else {
        setHistoryData((prev) => { const n = { ...prev }; delete n[id]; return n })
      }
    } catch {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: previous! } : item)))
      showError('Network error — failed to save status change.')
    }
  }

  async function handleProgressChange(id: number, progress: number) {
    if (!canEdit) return
    const previous = items.find((i) => i.id === id)?.milestone_progress
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, milestone_progress: progress } : item)))
    try {
      const res = await apiFetch(`/api/poam/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestone_progress: progress }),
      })
      if (!res.ok) {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, milestone_progress: previous! } : item)))
        showError(res.status === 401 ? 'Session expired — please refresh.' : 'Failed to update progress. Change reverted.')
      }
    } catch {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, milestone_progress: previous! } : item)))
      showError('Network error — failed to save progress change.')
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!canEdit || !form.gapStatement.trim()) return
    setSaving(true)
    try {
      const res = await apiFetch('/api/poam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gap_statement: form.gapStatement,
          root_cause: form.rootCause || null,
          remediation_plan: form.remediationPlan || null,
          closure_evidence: form.closureEvidence || null,
          practice_id: form.practiceId || null,
          responsible_individual: form.owner || null,
          resources_required: form.resources || null,
          scheduled_completion: form.date || null,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setItems((prev) => [created, ...prev])
        setForm(createEmptyPoamForm())
        setShowForm(false)
      } else {
        showError('Failed to create item. Please try again.')
      }
    } catch {
      showError('Network error — item was not saved.')
    }
    setSaving(false)
  }

  async function handleArchive(id: number) {
    if (!isAdmin) return
    try {
      const res = await apiFetch(`/api/poam/${id}`, { method: 'DELETE' })
      if (res.ok) {
        const archived = await res.json()
        setItems((prev) => prev.filter((item) => item.id !== id))
        setArchivedItems((prev) => [archived, ...prev])
        setArchiveConfirmId(null)
      } else {
        showError(res.status === 401 ? 'Session expired — please refresh.' : 'Failed to archive item.')
      }
    } catch {
      showError('Network error — item was not archived.')
    }
  }

  async function handleRestore(id: number) {
    if (!isAdmin) return
    try {
      const res = await apiFetch(`/api/poam/${id}/restore`, { method: 'POST' })
      if (res.ok) {
        const restored = await res.json()
        setArchivedItems((prev) => prev.filter((item) => item.id !== id))
        setItems((prev) => [restored, ...prev])
      } else {
        showError('Failed to restore item.')
      }
    } catch {
      showError('Network error — item was not restored.')
    }
  }

  async function loadArchivedItems() {
    setArchivedLoading(true)
    try {
      const res = await apiFetch('/api/poam?include_archived=true')
      if (res.ok) {
        const all = await res.json() as PoamItem[]
        setArchivedItems(all.filter((i) => i.deleted_at !== null))
      }
    } catch {
      // silent — archived section will just be empty
    }
    setArchivedLoading(false)
  }

  async function toggleShowArchived() {
    const next = !showArchived
    setShowArchived(next)
    if (next && archivedItems.length === 0) {
      await loadArchivedItems()
    }
  }

  async function toggleHistory(id: number) {
    setHistoryExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        return next
      }
      next.add(id)
      return next
    })
    // Lazy load if not yet fetched
    if (!historyData[id] && !historyLoading.has(id)) {
      setHistoryLoading((prev) => new Set(prev).add(id))
      try {
        const res = await apiFetch(`/api/poam/${id}/history`)
        if (res.ok) {
          const rows = await res.json() as PoamHistoryEntry[]
          setHistoryData((prev) => ({ ...prev, [id]: rows }))
        }
      } finally {
        setHistoryLoading((prev) => { const n = new Set(prev); n.delete(id); return n })
      }
    }
  }

  function renderHistoryPanel(id: number) {
    const rows = historyData[id]
    const loading = historyLoading.has(id)
    return (
      <TableRow className="bg-card/10 hover:bg-card/10">
        <TableCell colSpan={8} className="px-6 py-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">Change History</p>
          {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
          {!loading && rows && rows.length === 0 && (
            <p className="text-xs text-muted-foreground">No changes recorded yet.</p>
          )}
          {!loading && rows && rows.length > 0 && (
            <div className="space-y-1">
              {rows.map((row) => (
                <div key={row.id} className="text-xs text-muted-foreground">
                  <span className="text-foreground/60">{new Date(row.changed_at).toLocaleString()}</span>
                  {' · '}
                  <span className="text-foreground/80">{row.changed_by}</span>
                  {' changed '}
                  <span className="font-mono text-foreground/80">{row.field_changed}</span>
                  {': '}
                  <span className="text-red-400/70 line-through">{row.old_value ?? '(empty)'}</span>
                  {' → '}
                  <span className="text-green-400/70">{row.new_value ?? '(empty)'}</span>
                </div>
              ))}
            </div>
          )}
        </TableCell>
      </TableRow>
    )
  }

  function renderItemRow(item: PoamItem, isArchived = false) {
    const isExpanded = expandedIds.has(item.id)
    const isHistoryExpanded = historyExpandedIds.has(item.id)
    const historyCount = historyData[item.id]?.length ?? 0

    return (
      <React.Fragment key={item.id}>
        <TableRow className={isArchived ? 'opacity-50' : ''}>
          <TableCell><span className="font-mono text-xs text-muted-foreground">{item.practice_id ?? '—'}</span></TableCell>
          <TableCell>
            <button
              type="button"
              onClick={() => toggleExpand(item.id)}
              className="flex w-full items-start gap-2 text-left"
            >
              <svg
                className={`mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/60 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
              >
                <path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="line-clamp-1 text-xs text-foreground">
                {item.gap_statement.split('\n')[0]}
              </span>
            </button>
          </TableCell>
          <TableCell><span className="text-xs text-muted-foreground">{item.responsible_individual ?? '—'}</span></TableCell>
          <TableCell><span className="text-xs text-muted-foreground">{formatScheduledCompletion(item.scheduled_completion)}</span></TableCell>
          <TableCell>
            <Select
              value={String(item.milestone_progress)}
              onValueChange={(v) => handleProgressChange(item.id, parseInt(v, 10))}
              disabled={!canEdit || isArchived}
            >
              <SelectTrigger className="h-8 w-20 border-border/70 bg-card/40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((p) => (
                  <SelectItem key={p} value={String(p)}>{p}%</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TableCell>
          <TableCell>
            <Select
              value={item.status}
              onValueChange={(v) => handleStatusChange(item.id, v as PoamStatus)}
              disabled={!canEdit || isArchived}
            >
              <SelectTrigger className={`h-8 w-28 border px-2 text-xs ${STATUS_COLORS[item.status]}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </TableCell>
          <TableCell>
            <button
              type="button"
              onClick={() => toggleHistory(item.id)}
              className="text-xs text-muted-foreground transition-colors hover:text-sky-300"
              title="Show history"
            >
              History{historyCount > 0 && <span className="ml-1 rounded bg-sky-900/40 px-1 text-[10px] text-sky-300">{historyCount}</span>}
            </button>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              {canEdit && !isArchived && (
                <button
                  onClick={() => editingId === item.id ? setEditingId(null) : startEdit(item)}
                  className="text-xs text-muted-foreground transition-colors hover:text-sky-300"
                  title="Edit"
                >
                  ✎
                </button>
              )}
              {isAdmin && !isArchived && archiveConfirmId !== item.id && (
                <button
                  onClick={() => setArchiveConfirmId(item.id)}
                  className="text-xs text-muted-foreground transition-colors hover:text-amber-300"
                  title="Archive"
                >
                  ⊘
                </button>
              )}
              {isAdmin && !isArchived && archiveConfirmId === item.id && (
                <span className="flex items-center gap-1 text-xs">
                  <button onClick={() => handleArchive(item.id)} className="text-amber-300 hover:text-amber-100">Archive?</button>
                  <button onClick={() => setArchiveConfirmId(null)} className="text-muted-foreground hover:text-foreground">Cancel</button>
                </span>
              )}
              {isAdmin && isArchived && (
                <button
                  onClick={() => handleRestore(item.id)}
                  className="text-xs text-green-400/70 transition-colors hover:text-green-300"
                  title="Restore"
                >
                  Restore
                </button>
              )}
            </div>
          </TableCell>
        </TableRow>

        {isExpanded && editingId !== item.id && (
          <TableRow className="bg-card/20 hover:bg-card/20">
            <TableCell colSpan={8} className="px-6 py-4">
              <div className="space-y-4 border-l-2 border-sky-500/20 pl-4">
                {[
                  { label: 'Gap Statement', value: item.gap_statement },
                  { label: 'Root Cause', value: item.root_cause },
                  { label: 'Remediation Plan', value: item.remediation_plan },
                  { label: 'Closure Evidence', value: item.closure_evidence },
                ].map(({ label, value }) => value ? (
                  <div key={label}>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60 mb-1">{label}</p>
                    <p className="text-xs leading-6 text-foreground/90 whitespace-pre-wrap">{value}</p>
                  </div>
                ) : null)}
                {item.resources_required && (
                  <div className="border-t border-border/40 pt-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60 mb-1">Resources Required</p>
                    <p className="text-xs leading-6 text-muted-foreground">{item.resources_required}</p>
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}

        {editingId === item.id && (
          <TableRow className="bg-card/20 hover:bg-card/20">
            <TableCell colSpan={8} className="p-4">
              <form onSubmit={handleEdit} className="space-y-3">
                <p className="command-kicker">Edit item</p>
                <PoamFormFields
                  form={editForm}
                  onChange={(patch) => setEditForm((prev) => ({ ...prev, ...patch }))}
                  isClosing={editForm.gapStatement !== '' && (items.find(i => i.id === editingId)?.status !== 'Closed')}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" size="sm" variant="outline" className="h-8 border-border/80 bg-card/40 text-xs" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="h-8 text-xs" disabled={editSaving}>
                    {editSaving ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              </form>
            </TableCell>
          </TableRow>
        )}

        {isHistoryExpanded && renderHistoryPanel(item.id)}
      </React.Fragment>
    )
  }

  return (
    <>
      <section className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="space-y-4">
          <p className="command-kicker">Remediation command surface</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Plan of Action &amp; Milestones</h1>
          <p className="max-w-[44rem] text-sm leading-6 text-muted-foreground">
            Track remediation findings from identification through closure. Due dates, milestone progress, and status stay visible in one place.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="command-panel px-4 py-3">
              <div className="text-2xl font-semibold tabular-nums text-red-300">{summary.openCount}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Open</div>
            </div>
            <div className="command-panel px-4 py-3">
              <div className="text-2xl font-semibold tabular-nums text-amber-300">{summary.inProgressCount}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">In progress</div>
            </div>
            <div className="command-panel px-4 py-3">
              <div className="text-2xl font-semibold tabular-nums text-green-300">{summary.closedCount}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Closed</div>
            </div>
          </div>
        </div>

        <div className="command-panel p-4">
          <div className="flex items-center justify-between">
            <p className="command-kicker">Control view</p>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-border/80 bg-card/40 text-xs"
                onClick={() => setShowForm((v) => !v)}
              >
                {showForm ? 'Cancel' : 'Create item'}
              </Button>
            )}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="w-36">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 border-border/80 bg-card/40 text-xs">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <button
                onClick={toggleShowArchived}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {showArchived ? 'Hide archived' : 'Show archived'}
              </button>
            )}
          </div>
        </div>
      </section>

      {canEdit && showForm && (
        <form onSubmit={handleCreate} className="command-panel space-y-3 p-4">
          <p className="command-kicker">Create item</p>
          <PoamFormFields
            form={form}
            onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
            isClosing={false}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" className="h-8 text-xs" disabled={saving}>
              {saving ? 'Saving…' : 'Create item'}
            </Button>
          </div>
        </form>
      )}

      {saveError && (
        <div className="flex items-center justify-between border border-red-900/60 bg-red-950/20 px-4 py-2.5 text-xs text-red-300">
          <span>{saveError}</span>
          <button onClick={() => setSaveError(null)} className="ml-4 text-red-400 hover:text-red-200">×</button>
        </div>
      )}

      {filteredItems.length === 0 && (!showArchived || archivedItems.length === 0) ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {items.length === 0
            ? 'No POA&M items yet. Create the first item to start tracking remediation work.'
            : 'No items match the current filter.'}
        </div>
      ) : (
        <div className="command-table-shell">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Practice</TableHead>
                <TableHead>Gap Statement</TableHead>
                <TableHead className="w-36">Owner</TableHead>
                <TableHead className="w-28">Due Date</TableHead>
                <TableHead className="w-24">Progress</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-20">History</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => renderItemRow(item))}
              {showArchived && archivedLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="py-4 text-center text-xs text-muted-foreground">
                    Loading archived items…
                  </TableCell>
                </TableRow>
              )}
              {showArchived && !archivedLoading && archivedItems.length > 0 && (
                <>
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8} className="py-2">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/40">Archived</p>
                    </TableCell>
                  </TableRow>
                  {archivedItems.map((item) => renderItemRow(item, true))}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Update GET /api/poam to support `include_archived` (needed by "Show archived" toggle)**

Add a GET handler to `src/app/api/poam/route.ts`:

```typescript
// Add this BEFORE the POST export in route.ts:

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  const authError = requireRole(session, 'viewer')
  if (authError) return authError

  const includeArchived = req.nextUrl.searchParams.get('include_archived') === 'true'
  const isAdmin = session?.user.role === 'admin'

  if (includeArchived && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const items = includeArchived
    ? await sql`SELECT * FROM poam_items ORDER BY deleted_at DESC NULLS LAST, created_at DESC`
    : await sql`SELECT * FROM poam_items WHERE deleted_at IS NULL ORDER BY created_at DESC`

  return NextResponse.json(items)
}
```

Also add the `NextRequest` import is already present; add `session` role check using the existing pattern.

- [ ] **Step 3: Verify TypeScript compiles with zero new errors**

```bash
npx tsc --noEmit 2>&1 | grep "error" | head -20
```

- [ ] **Step 4: Manual smoke test**

Start the dev server. Navigate to `/poam`. Verify:
- Table header shows "Gap Statement" not "Finding"
- Create form has 4 labeled textareas
- Edit form has 4 labeled textareas
- Archive button (⊘) appears for admins; clicking shows "Archive? / Cancel"
- Confirming archive removes the row from main table
- "Show archived" toggle appears for admins; clicking loads and displays archived rows with "Restore"
- Clicking "Restore" moves item back to main table
- History link appears per row; clicking loads and shows history (empty for new items)
- After editing a field and saving, History shows the change

- [ ] **Step 5: Commit**

```bash
git add src/app/poam/PoamTable.tsx src/app/api/poam/route.ts
git commit -m "feat: structured POAM form, archive/restore UI, history panel"
```

---

## Task 9: EvidenceDrawer — Add POA&M Button

**Files:**
- Modify: `src/components/EvidenceDrawer.tsx`

- [ ] **Step 1: Read the full EvidenceDrawer file**

Read `src/components/EvidenceDrawer.tsx` before editing.

- [ ] **Step 2: Add POA&M state and imports**

At the top of the file, add the import for `createEmptyPoamForm` and `PoamFormState`:

```typescript
import { apiFetch } from '@/lib/api-client'
import type { EvidenceItem } from '@/lib/types'
// add:
import type { PoamFormState } from '@/app/poam/poam-page-data'
import { createEmptyPoamForm } from '@/app/poam/poam-page-data'
```

Inside `EvidenceDrawer`, add state variables after the existing state:

```typescript
// POA&M quick-create
const [showPoamForm, setShowPoamForm] = useState(false)
const [poamForm, setPoamForm] = useState<PoamFormState>(() => createEmptyPoamForm(practiceId ?? ''))
const [poamSaving, setPoamSaving] = useState(false)
const [poamSuccess, setPoamSuccess] = useState(false)
```

Reset `poamForm.practiceId` when `practiceId` changes (add to the existing `useEffect` that resets on `practiceId`):

```typescript
useEffect(() => {
  if (!practiceId) { setItems([]); setObjStatuses({}); return }
  // existing fetch logic...
  setPoamForm(createEmptyPoamForm(practiceId))  // ← add this line
  setShowPoamForm(false)
  setPoamSuccess(false)
  // rest of existing useEffect...
}, [practiceId])
```

- [ ] **Step 3: Add the POA&M create handler and UI**

Add the submit handler inside `EvidenceDrawer`:

```typescript
async function handlePoamCreate(e: React.FormEvent) {
  e.preventDefault()
  if (!poamForm.gapStatement.trim()) return
  setPoamSaving(true)
  try {
    const res = await apiFetch('/api/poam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gap_statement: poamForm.gapStatement,
        root_cause: poamForm.rootCause || null,
        remediation_plan: poamForm.remediationPlan || null,
        closure_evidence: poamForm.closureEvidence || null,
        practice_id: practiceId,
        responsible_individual: poamForm.owner || null,
        resources_required: poamForm.resources || null,
        scheduled_completion: poamForm.date || null,
      }),
    })
    if (res.ok) {
      setPoamForm(createEmptyPoamForm(practiceId ?? ''))
      setShowPoamForm(false)
      setPoamSuccess(true)
      setTimeout(() => setPoamSuccess(false), 4000)
    } else {
      setError('Failed to create POA&M item.')
    }
  } catch {
    setError('Network error — POA&M item was not saved.')
  }
  setPoamSaving(false)
}
```

Add a "POA&M" tab to the `drawerTab` state type and tab bar. The existing tabs are `'evidence' | 'objectives'` — add `'poam'`:

In the tab bar JSX (find the existing tab buttons in the render), add a third tab button:
```tsx
{canEdit && (
  <button
    type="button"
    onClick={() => setDrawerTab('poam')}
    className={`text-xs transition-colors ${drawerTab === 'poam' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
  >
    POA&amp;M
  </button>
)}
```

Add the POA&M tab panel below the evidence and objectives panels:

```tsx
{drawerTab === 'poam' && canEdit && (
  <div className="space-y-4 p-4">
    <p className="command-kicker">Add POA&amp;M item</p>
    <p className="text-xs text-muted-foreground">
      Creates a new POA&amp;M item pre-linked to this practice.
    </p>
    {poamSuccess && (
      <div className="border border-green-900/60 bg-green-950/20 px-3 py-2 text-xs text-green-300">
        POA&amp;M item created. View all items on the <a href="/poam" className="underline hover:text-green-200">POA&amp;M page</a>.
      </div>
    )}
    {!showPoamForm && (
      <button
        type="button"
        onClick={() => setShowPoamForm(true)}
        className="text-xs text-sky-400 hover:text-sky-300 underline"
      >
        + Create POA&amp;M item for this practice
      </button>
    )}
    {showPoamForm && (
      <form onSubmit={handlePoamCreate} className="space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
            Gap Statement <span className="text-red-400">*</span>
          </label>
          <textarea
            required
            value={poamForm.gapStatement}
            onChange={(e) => setPoamForm((prev) => ({ ...prev, gapStatement: e.target.value }))}
            rows={5}
            maxLength={5000}
            className="w-full resize-y border border-border/70 bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="What is missing or weak?"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">Remediation Plan</label>
          <textarea
            value={poamForm.remediationPlan}
            onChange={(e) => setPoamForm((prev) => ({ ...prev, remediationPlan: e.target.value }))}
            rows={3}
            maxLength={5000}
            className="w-full resize-y border border-border/70 bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Actions planned…"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => { setShowPoamForm(false); setPoamForm(createEmptyPoamForm(practiceId ?? '')) }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={poamSaving}
            className="text-xs text-sky-400 hover:text-sky-300 disabled:opacity-50"
          >
            {poamSaving ? 'Saving…' : 'Save POA&M item'}
          </button>
        </div>
      </form>
    )}
  </div>
)}
```

- [ ] **Step 4: Update `drawerTab` state type**

Find `const [drawerTab, setDrawerTab] = useState<'evidence' | 'objectives'>('evidence')` and update to:

```typescript
const [drawerTab, setDrawerTab] = useState<'evidence' | 'objectives' | 'poam'>('evidence')
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep "error" | head -20
```

Expected: no errors.

- [ ] **Step 6: Manual smoke test**

1. Navigate to a domain page and open a practice drawer.
2. Verify a "POA&M" tab appears (only when `canEdit`).
3. Click "POA&M" tab → see "Create POA&M item for this practice" link.
4. Click the link → form expands with Gap Statement and Remediation Plan fields.
5. Fill in Gap Statement, submit → success banner appears, form collapses.
6. Navigate to `/poam` → new item appears linked to that practice.

- [ ] **Step 7: Commit**

```bash
git add src/components/EvidenceDrawer.tsx
git commit -m "feat: add POA&M tab to practice evidence drawer"
```

---

## Spec Coverage Self-Check

| Spec requirement | Covered by |
|---|---|
| `gap_statement`, `root_cause`, `remediation_plan`, `closure_evidence` columns | Task 1 migration |
| `deleted_at` column | Task 1 migration |
| `poam_history` table | Task 1 migration |
| `finding` data migrated to `gap_statement`, old column dropped | Task 1 migration |
| POST accepts 4 structured fields, `gap_statement` required | Tasks 2, 3 |
| PATCH accepts 4 structured fields, writes history rows | Task 4 |
| DELETE → soft-delete (`deleted_at = NOW()`) | Task 4 |
| POST /api/poam/[id]/restore | Task 5 |
| GET /api/poam/[id]/history | Task 5 |
| GET /api/poam default = active only; `?include_archived=true` = admin only | Task 8 |
| Create form has 4 labeled textareas | Task 8 |
| Edit form has 4 labeled textareas | Task 8 |
| "Remediation Plan" / "Closure Evidence" hint text when closing | Task 8 |
| Archive button with inline confirmation | Task 8 |
| Archived items hidden from main view | Tasks 7, 8 |
| Admin "Show archived" toggle with muted rows | Task 8 |
| Restore button on archived rows | Task 8 |
| History link per row with count badge | Task 8 |
| Lazy-loaded history panel with timeline | Task 8 |
| "Add POA&M" on practice page, pre-filled practice_id | Task 9 |
| On save: stay on practice page, show success banner | Task 9 |
