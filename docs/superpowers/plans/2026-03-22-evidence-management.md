# Evidence Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `evidence_exists` boolean toggle with real evidence records — files and URLs — attached to CMMC practices, surfaced via a side drawer on the domain page.

**Architecture:** Server-component-first. Domain page fetches evidence counts server-side and merges them into practice data. The `EvidenceDrawer` client component fetches full evidence lists lazily when opened. Mutations go through API routes that keep `evidence_exists` in sync.

**Tech Stack:** Next.js 14 App Router, TypeScript, postgres.js, Node.js `fs/promises`, Docker named volume for file storage.

**Spec:** `docs/superpowers/specs/2026-03-22-evidence-management-design.md`

---

## File Structure

**Create:**
- `scripts/migrations/002-evidence.sql` — DB table and index
- `src/lib/evidence.ts` — file I/O helpers: write, delete, path validation
- `src/app/api/practices/[id]/evidence/route.ts` — GET list + POST add
- `src/app/api/practices/[id]/evidence/[eid]/route.ts` — DELETE one item
- `src/app/api/evidence/[...path]/route.ts` — serve stored files from disk
- `src/components/EvidenceDrawer.tsx` — side drawer client component

**Modify:**
- `src/lib/types.ts` — add `EvidenceItem` interface; add `evidence_count?: number` to `Practice`
- `docker-compose.yml` — add `evidence_data` named volume
- `src/app/domain/[id]/page.tsx` — add evidence count query, pass counts to `PracticeTable`
- `src/components/PracticeTable.tsx` — replace Switch with evidence badge; integrate `EvidenceDrawer`
- `docs/RUNBOOK.md` — add evidence file backup section

---

## Task 1: DB Migration + Docker Volume

**Files:**
- Create: `scripts/migrations/002-evidence.sql`
- Modify: `docker-compose.yml`

- [ ] **Step 1: Create the migration file**

```sql
-- scripts/migrations/002-evidence.sql
CREATE TABLE IF NOT EXISTS practice_evidence (
  id            SERIAL PRIMARY KEY,
  practice_id   TEXT NOT NULL REFERENCES practices(practice_id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  file_path     TEXT,
  url           TEXT,
  uploaded_by   TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT evidence_has_one_source CHECK (
    (file_path IS NULL) != (url IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS practice_evidence_practice_id_idx
  ON practice_evidence(practice_id);
```

- [ ] **Step 2: Run the migration**

Apply the migration directly via `psql`. The `DATABASE_URL` is in `.env.local`.

```bash
# Load DATABASE_URL from .env.local, then apply migration
export $(grep DATABASE_URL .env.local | xargs)
psql "$DATABASE_URL" -f scripts/migrations/002-evidence.sql
```

Expected output: `CREATE TABLE`, `CREATE INDEX`

If `psql` is not installed locally, run it inside the DB container:

```bash
docker compose exec db psql -U postgres -d cmmc -f /dev/stdin < scripts/migrations/002-evidence.sql
```

- [ ] **Step 3: Add evidence_data volume to docker-compose.yml**

In `docker-compose.yml`, add volume mount to `app` service and declare the named volume:

```yaml
  app:
    # ... existing config ...
    volumes:
      - evidence_data:/data/evidence

volumes:
  pgdata:
  evidence_data:
```

- [ ] **Step 4: Commit**

```bash
git add scripts/migrations/002-evidence.sql docker-compose.yml
git commit -m "feat(evidence): add practice_evidence table and docker volume"
```

---

## Task 2: Types + File I/O Helpers

**Files:**
- Modify: `src/lib/types.ts`
- Create: `src/lib/evidence.ts`

- [ ] **Step 1: Add EvidenceItem type and evidence_count to Practice in types.ts**

Add after the `PoamItem` interface (around line 116):

```typescript
export interface EvidenceItem {
  id: number
  practice_id: string
  label: string
  file_path: string | null
  url: string | null
  uploaded_by: string
  created_at: string
}
```

Add `evidence_count?: number` to the `Practice` interface (after `notes`):

```typescript
export interface Practice {
  // ... existing fields ...
  notes: string | null
  evidence_count?: number   // ← add this line
  created_at: string
  updated_at: string
}
```

- [ ] **Step 2: Create src/lib/evidence.ts**

```typescript
import { mkdir, unlink, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export const EVIDENCE_ROOT = process.env.EVIDENCE_ROOT ?? '/data/evidence'

export const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.png', '.jpg', '.jpeg', '.gif',
  '.docx', '.xlsx', '.csv', '.txt', '.zip',
])

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'application/zip',
])

const MIME_MAP: Record<string, string> = {
  '.pdf':  'application/pdf',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv':  'text/csv',
  '.txt':  'text/plain',
  '.zip':  'application/zip',
}

const PATH_SEGMENT_RE = /^[a-zA-Z0-9._-]+$/

export function validateFileType(filename: string, mimeType: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  return ALLOWED_EXTENSIONS.has(ext) && ALLOWED_MIME_TYPES.has(mimeType)
}

export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE
}

/** Resolves a relative evidence path to an absolute path, or null if invalid. */
export function resolveEvidencePath(relPath: string): string | null {
  const segments = relPath.split('/')
  if (segments.length === 0 || segments.some((s) => !PATH_SEGMENT_RE.test(s))) return null
  const resolved = path.resolve(EVIDENCE_ROOT, ...segments)
  const prefix = EVIDENCE_ROOT.endsWith(path.sep) ? EVIDENCE_ROOT : EVIDENCE_ROOT + path.sep
  if (!resolved.startsWith(prefix)) return null
  return resolved
}

/** Writes an uploaded file to disk. Returns the relative path stored in DB. */
export async function writeEvidenceFile(
  practiceId: string,
  filename: string,
  buffer: Buffer,
): Promise<string> {
  const ext = path.extname(filename).toLowerCase()
  const safeId = practiceId.replace(/[^a-zA-Z0-9._-]/g, '_')
  await mkdir(path.join(EVIDENCE_ROOT, safeId), { recursive: true })
  const uuid = randomUUID()
  const relPath = `${safeId}/${uuid}${ext}`
  await writeFile(path.join(EVIDENCE_ROOT, safeId, `${uuid}${ext}`), buffer)
  return relPath
}

/** Deletes a stored evidence file. Silently ignores missing files. */
export async function deleteEvidenceFile(relPath: string): Promise<void> {
  const abs = resolveEvidencePath(relPath)
  if (!abs) return
  try {
    await unlink(abs)
  } catch {
    // already gone — not an error
  }
}

/** Returns the MIME type for a file extension. */
export function mimeTypeForPath(filePath: string): string {
  return MIME_MAP[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/evidence.ts
git commit -m "feat(evidence): add EvidenceItem type and file I/O helpers"
```

---

## Task 3: GET + POST Evidence API

**Files:**
- Create: `src/app/api/practices/[id]/evidence/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions, requireRole } from '@/lib/auth'
import sql from '@/lib/db'
import {
  deleteEvidenceFile,
  MAX_FILE_SIZE,
  validateFileSize,
  validateFileType,
  writeEvidenceFile,
} from '@/lib/evidence'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await sql`
    SELECT id, practice_id, label, file_path, url, uploaded_by, created_at
    FROM practice_evidence
    WHERE practice_id = ${params.id}
    ORDER BY created_at ASC
  `
  return NextResponse.json(items)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(getAuthOptions())
  const authError = requireRole(session, 'editor')
  if (authError) return authError

  const uploadedBy = session!.user?.email
  if (!uploadedBy) return NextResponse.json({ error: 'Session missing email' }, { status: 400 })

  const [practice] = await sql`
    SELECT practice_id FROM practices WHERE practice_id = ${params.id}
  `
  if (!practice) return NextResponse.json({ error: 'Practice not found' }, { status: 400 })

  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const label = (formData.get('label') as string | null)?.trim() ?? ''
    const file = formData.get('file') as File | null

    if (!label) return NextResponse.json({ error: 'label is required' }, { status: 400 })
    if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 })
    if (!validateFileSize(file.size)) {
      return NextResponse.json({ error: 'File exceeds 25 MB limit' }, { status: 400 })
    }
    if (!validateFileType(file.name, file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // DB insert first (spec requirement: no file on disk without a DB record)
    // Use a placeholder path, then update after file write succeeds
    const buffer = Buffer.from(await file.arrayBuffer())

    // Insert DB record first with a temporary placeholder so we hold the row
    // then write file, then update file_path. If file write fails, delete the row.
    let relPath: string
    let item: Record<string, unknown>
    ;[item] = await sql`
      INSERT INTO practice_evidence (practice_id, label, file_path, uploaded_by)
      VALUES (${params.id}, ${label}, ${'__pending__'}, ${uploadedBy})
      RETURNING *
    `
    try {
      relPath = await writeEvidenceFile(params.id, file.name, buffer)
    } catch {
      await sql`DELETE FROM practice_evidence WHERE id = ${(item as { id: number }).id}`
      return NextResponse.json({ error: 'Failed to write file' }, { status: 500 })
    }
    ;[item] = await sql`
      UPDATE practice_evidence SET file_path = ${relPath} WHERE id = ${(item as { id: number }).id}
      RETURNING *
    `
    await sql`UPDATE practices SET evidence_exists = true WHERE practice_id = ${params.id}`

    return NextResponse.json(item, { status: 201 })
  }

  // JSON — URL submission
  const body = await req.json()
  const label = typeof body.label === 'string' ? body.label.trim() : ''
  const url = typeof body.url === 'string' ? body.url.trim() : ''

  if (!label) return NextResponse.json({ error: 'label is required' }, { status: 400 })
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  const [item] = await sql`
    INSERT INTO practice_evidence (practice_id, label, url, uploaded_by)
    VALUES (${params.id}, ${label}, ${url}, ${uploadedBy})
    RETURNING *
  `
  await sql`UPDATE practices SET evidence_exists = true WHERE practice_id = ${params.id}`
  return NextResponse.json(item, { status: 201 })
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Smoke test (manual)**

With the dev server running:
```bash
# Should return 401
curl http://localhost:3000/api/practices/AC.1.001/evidence
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/practices/[id]/evidence/route.ts
git commit -m "feat(evidence): add GET and POST evidence API"
```

---

## Task 4: DELETE Evidence API

**Files:**
- Create: `src/app/api/practices/[id]/evidence/[eid]/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions, requireRole } from '@/lib/auth'
import sql from '@/lib/db'
import { deleteEvidenceFile } from '@/lib/evidence'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; eid: string } },
) {
  const session = await getServerSession(getAuthOptions())
  const authError = requireRole(session, 'editor')
  if (authError) return authError

  const evidenceId = parseInt(params.eid, 10)
  if (isNaN(evidenceId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const [item] = await sql`
    DELETE FROM practice_evidence
    WHERE id = ${evidenceId} AND practice_id = ${params.id}
    RETURNING file_path
  `
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (item.file_path) await deleteEvidenceFile(item.file_path)

  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count
    FROM practice_evidence
    WHERE practice_id = ${params.id}
  `
  if (count === 0) {
    await sql`
      UPDATE practices SET evidence_exists = false WHERE practice_id = ${params.id}
    `
  }

  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/practices/[id]/evidence/[eid]/route.ts"
git commit -m "feat(evidence): add DELETE evidence API"
```

---

## Task 5: File Serve API

**Files:**
- Create: `src/app/api/evidence/[...path]/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { mimeTypeForPath, resolveEvidencePath } from '@/lib/evidence'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const relPath = params.path.join('/')
  const abs = resolveEvidencePath(relPath)
  if (!abs) return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  if (!existsSync(abs)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data = await readFile(abs)
  const mimeType = mimeTypeForPath(abs)

  return new NextResponse(data, {
    headers: { 'Content-Type': mimeType },
  })
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/evidence/[...path]/route.ts"
git commit -m "feat(evidence): add authenticated file serve route"
```

---

## Task 6: Domain Page — Evidence Counts

**Files:**
- Modify: `src/app/domain/[id]/page.tsx`

- [ ] **Step 1: Add evidence count query after fetchEffectivePractices**

In `src/app/domain/[id]/page.tsx`, find the line containing `const residualTotals` and add the following block immediately after it:

```typescript
  // Evidence counts per practice
  const practiceIds = effectivePractices.map((p) => p.practice_id)
  const evidenceCounts = practiceIds.length > 0
    ? await sql<Array<{ practice_id: string; evidence_count: number }>>`
        SELECT practice_id, COUNT(*)::int AS evidence_count
        FROM practice_evidence
        WHERE practice_id = ANY(${sql.array(practiceIds)})
        GROUP BY practice_id
      `
    : []
  const evidenceCountMap = new Map(evidenceCounts.map((r) => [r.practice_id, r.evidence_count]))
  const practicesWithEvidence = effectivePractices.map((p) => ({
    ...p,
    evidence_count: evidenceCountMap.get(p.practice_id) ?? 0,
  }))
```

- [ ] **Step 2: Update the evidenceGap calculation to use real counts**

Find the existing `evidenceGap` declaration (the line beginning `const evidenceGap`) and replace it with:

```typescript
  const evidenceGap = practicesWithEvidence.filter((practice) =>
    practice.is_customer_scored &&
    (practice.status === 'Implemented' || practice.status === 'Audit Ready') &&
    practice.evidence_count === 0,
  ).length
```

- [ ] **Step 3: Pass practicesWithEvidence to PracticeTable**

Find the line `<PracticeTable practices={effectivePractices} canEdit={canEdit} />` and replace it with:
```typescript
        <PracticeTable practices={practicesWithEvidence} canEdit={canEdit} />
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/app/domain/[id]/page.tsx
git commit -m "feat(evidence): add evidence counts to domain page"
```

---

## Task 7: EvidenceDrawer + PracticeTable Badge

**Files:**
- Create: `src/components/EvidenceDrawer.tsx`
- Modify: `src/components/PracticeTable.tsx`

- [ ] **Step 1: Create EvidenceDrawer.tsx**

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'
import type { EvidenceItem } from '@/lib/types'

interface EvidenceDrawerProps {
  practiceId: string | null
  practiceTitle: string
  canEdit: boolean
  onClose: () => void
  onCountChange: (practiceId: string, delta: number) => void
}

export function EvidenceDrawer({
  practiceId,
  practiceTitle,
  canEdit,
  onClose,
  onCountChange,
}: EvidenceDrawerProps) {
  const [items, setItems] = useState<EvidenceItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file')
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!practiceId) { setItems([]); return }
    let active = true
    setLoading(true)
    setError(null)
    fetch(`/api/practices/${practiceId}/evidence`)
      .then((r) => r.json())
      .then((data: EvidenceItem[]) => { if (active) { setItems(data); setLoading(false) } })
      .catch(() => { if (active) { setError('Failed to load evidence'); setLoading(false) } })
    return () => { active = false }
  }, [practiceId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleAddUrl(e: React.FormEvent) {
    e.preventDefault()
    if (!practiceId || !label.trim() || !url.trim()) return
    setUploading(true); setError(null)
    const res = await fetch(`/api/practices/${practiceId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: label.trim(), url: url.trim() }),
    })
    if (res.ok) {
      const item: EvidenceItem = await res.json()
      setItems((prev) => [...prev, item])
      onCountChange(practiceId, 1)
      setLabel(''); setUrl('')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to add link')
    }
    setUploading(false)
  }

  async function handleAddFile(e: React.FormEvent) {
    e.preventDefault()
    if (!practiceId || !label.trim() || !fileInputRef.current?.files?.[0]) return
    const file = fileInputRef.current.files[0]
    setUploading(true); setError(null)
    const formData = new FormData()
    formData.append('label', label.trim())
    formData.append('file', file)
    const res = await fetch(`/api/practices/${practiceId}/evidence`, {
      method: 'POST',
      body: formData,
    })
    if (res.ok) {
      const item: EvidenceItem = await res.json()
      setItems((prev) => [...prev, item])
      onCountChange(practiceId, 1)
      setLabel('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to upload file')
    }
    setUploading(false)
  }

  async function handleDelete(id: number) {
    if (!practiceId) return
    const res = await fetch(`/api/practices/${practiceId}/evidence/${id}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) {
      setItems((prev) => prev.filter((item) => item.id !== id))
      onCountChange(practiceId, -1)
    }
  }

  if (!practiceId) return null

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l border-sky-500/30 bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border px-4 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Evidence</p>
          <p className="mt-1 font-mono text-xs font-semibold text-sky-300">{practiceId}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{practiceTitle}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-lg leading-none text-muted-foreground hover:text-foreground"
          aria-label="Close evidence drawer"
        >
          ×
        </button>
      </div>

      {/* Evidence list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pb-1 pt-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Attached ({items.length})
          </p>
        </div>
        {loading && <p className="px-4 py-2 text-xs text-muted-foreground">Loading…</p>}
        {!loading && items.length === 0 && (
          <p className="px-4 py-2 text-xs text-muted-foreground">No evidence attached yet.</p>
        )}
        <div className="px-4 pb-2 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between border border-border/60 bg-card/30 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">{item.label}</p>
                {item.file_path && (
                  <a
                    href={`/api/evidence/${item.file_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block truncate text-[10px] text-sky-300 hover:text-sky-200"
                  >
                    📄 {item.file_path.split('/').pop()}
                  </a>
                )}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block truncate text-[10px] text-sky-300 hover:text-sky-200"
                  >
                    🔗 {item.url}
                  </a>
                )}
                <p className="mt-1 text-[10px] text-muted-foreground/60">
                  {item.uploaded_by} ·{' '}
                  {new Date(item.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {canEdit && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="ml-2 text-muted-foreground hover:text-red-300"
                  title="Delete evidence"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add evidence form */}
      {canEdit && (
        <div className="border-t border-border px-4 py-4">
          <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Add evidence
          </p>
          <input
            type="text"
            placeholder="Label (required)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mb-3 w-full border border-border/70 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="mb-3 flex border-b border-border">
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`pb-2 pr-4 text-[10px] uppercase tracking-[0.14em] transition-colors ${
                activeTab === 'file'
                  ? 'border-b-2 border-sky-400 text-sky-300'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              File
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`pb-2 px-4 text-[10px] uppercase tracking-[0.14em] transition-colors ${
                activeTab === 'url'
                  ? 'border-b-2 border-sky-400 text-sky-300'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              URL
            </button>
          </div>
          {activeTab === 'file' ? (
            <form onSubmit={handleAddFile}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.gif,.docx,.xlsx,.csv,.txt,.zip"
                className="mb-3 w-full text-xs text-muted-foreground file:mr-3 file:border file:border-border/70 file:bg-card/40 file:px-2 file:py-1 file:text-xs file:text-foreground"
              />
              <button
                type="submit"
                disabled={uploading}
                className="w-full border border-border/70 bg-card/40 py-2 text-xs text-foreground hover:bg-card/60 disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : 'Upload file'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAddUrl}>
              <input
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mb-3 w-full border border-border/70 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={uploading}
                className="w-full border border-border/70 bg-card/40 py-2 text-xs text-foreground hover:bg-card/60 disabled:opacity-50"
              >
                {uploading ? 'Saving…' : 'Add link'}
              </button>
            </form>
          )}
          {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update PracticeTable.tsx — add drawer state and import**

At the top of `src/components/PracticeTable.tsx`, add the import:

```typescript
import { EvidenceDrawer } from '@/components/EvidenceDrawer'
```

Inside the `PracticeTable` component, add state after the existing state declarations:

```typescript
  const [evidenceCounts, setEvidenceCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(practices.map((p) => [p.practice_id, p.evidence_count ?? 0]))
  )
  const [drawerPracticeId, setDrawerPracticeId] = useState<string | null>(null)

  function handleEvidenceCountChange(practiceId: string, delta: number) {
    setEvidenceCounts((prev) => ({
      ...prev,
      [practiceId]: Math.max(0, (prev[practiceId] ?? 0) + delta),
    }))
  }
```

- [ ] **Step 3: Replace the evidence Switch with a badge button**

Find the `<TableCell>` containing `aria-label="Evidence exists"` and replace that entire `<TableCell>` block with:

```typescript
                  <TableCell>
                    <button
                      onClick={() => setDrawerPracticeId(practice.practice_id)}
                      className={`text-[10px] uppercase tracking-[0.14em] px-2 py-1 border transition-colors ${
                        (evidenceCounts[practice.practice_id] ?? 0) > 0
                          ? 'border-green-800/60 bg-green-950/20 text-green-300 hover:bg-green-950/40'
                          : 'border-border/50 bg-card/20 text-muted-foreground hover:bg-card/40'
                      }`}
                    >
                      {evidenceCounts[practice.practice_id] ?? 0}{' '}
                      {(evidenceCounts[practice.practice_id] ?? 0) === 1 ? 'item' : 'items'}
                    </button>
                  </TableCell>
```

- [ ] **Step 4: Add EvidenceDrawer to the return JSX**

At the end of the `PracticeTable` return, just before the final closing `</>`, add:

```typescript
      <EvidenceDrawer
        practiceId={drawerPracticeId}
        practiceTitle={
          practices.find((p) => p.practice_id === drawerPracticeId)?.title ?? ''
        }
        canEdit={canEdit}
        onClose={() => setDrawerPracticeId(null)}
        onCountChange={handleEvidenceCountChange}
      />
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Start dev server and test manually**

```bash
npm run dev
```

1. Navigate to any domain page (e.g. `http://localhost:3000/domain/1`)
2. Click the evidence badge on any practice — drawer should slide in
3. Add a URL: enter label "Test link", switch to URL tab, enter `https://example.com`, click Add link
4. Badge count should increment to "1 item"
5. Delete the item — badge should return to "0 items"
6. Upload a file: enter label, select a PDF, click Upload file
7. Verify the file link in the drawer opens the file

- [ ] **Step 7: Commit**

```bash
git add src/components/EvidenceDrawer.tsx src/components/PracticeTable.tsx
git commit -m "feat(evidence): add EvidenceDrawer and evidence badge to PracticeTable"
```

---

## Task 8: Runbook Update

**Files:**
- Modify: `docs/RUNBOOK.md`

- [ ] **Step 1: Add evidence backup section**

Add the following section to `docs/RUNBOOK.md` under a new heading after the existing backup content:

```markdown
## Evidence File Backup

Evidence files are stored in the `evidence_data` Docker named volume at `/data/evidence/` inside the app container. They are NOT included in the `export-data` JSON backup.

To back up evidence files:

```bash
docker run --rm \
  -v evidence_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/evidence-$(date +%Y%m%d).tar.gz /data
```

To restore (substitute the actual backup filename for `evidence-YYYYMMDD.tar.gz`):

```bash
docker run --rm \
  -v evidence_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/evidence-YYYYMMDD.tar.gz -C /
```

Run both the database export and the evidence backup together for a complete snapshot.
```

- [ ] **Step 2: Commit and push**

```bash
git add docs/RUNBOOK.md
git commit -m "docs: add evidence file backup instructions to runbook"
git push
```
