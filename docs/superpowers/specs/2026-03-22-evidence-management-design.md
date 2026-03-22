# Evidence Management Design

**Date:** 2026-03-22
**Status:** Approved

## Goal

Replace the boolean `evidence_exists` toggle on CMMC practices with real evidence records — files and URLs — attached per practice. Close the evidence gap metric on the overview and domain pages with meaningful data.

## Architecture

Server-component-first, consistent with the rest of the dashboard. Evidence counts are fetched server-side as part of the domain page render. Full evidence lists are fetched client-side when a drawer opens (lazy, on demand).

## Data Model

New table `practice_evidence`:

```sql
CREATE TABLE practice_evidence (
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

CREATE INDEX practice_evidence_practice_id_idx ON practice_evidence(practice_id);
```

`uploaded_by` is populated from `session.user.email` at the API layer. It is NOT NULL — if somehow the session has no email (should not occur with CredentialsProvider), the POST returns 400.

`evidence_exists` on `practices` remains a boolean. App logic sets it to `true` when evidence is added and `false` when the last item is deleted. No DB trigger required.

### evidence_exists sync and race conditions

The POST handler writes the DB record first, then writes the file to disk. If the file write fails after a successful DB insert, the orphaned record is deleted and a 500 is returned. This ensures no file exists without a DB record.

Under concurrent deletes, both requests may set `evidence_exists = false` — this is idempotent and harmless. Under concurrent inserts from count=0, both set `evidence_exists = true` — also idempotent and correct. This is an accepted v1 limitation.

## File Storage

- Docker named volume `evidence_data` mounted at `/data/evidence/` in the app container
- File path stored in DB as a relative path, e.g. `AC.1.001/a3f2c1d4.pdf`
- Full path resolved at serve time as `/data/evidence/[relative_path]`
- Max file size: 25 MB per file, enforced at the API layer
- Allowed MIME types / extensions: PDF, PNG, JPG/JPEG, GIF, DOCX, XLSX, CSV, TXT, ZIP. Requests with other types rejected with 400.
- `docker-compose.yml` adds the `evidence_data` named volume
- Files are not included in `export-data` JSON. The runbook documents a separate file backup procedure using `docker run --rm -v evidence_data:/data -v $(pwd):/backup alpine tar czf /backup/evidence-backup.tar.gz /data`.

## Path Traversal Protection

The file serve route (`/api/evidence/[...path]`) validates each path segment against the pattern `^[a-zA-Z0-9._-]+$` before joining. The resolved absolute path is then confirmed to start with `/data/evidence/` before the file is opened. Any path failing either check returns 400.

## API Routes

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/practices/[id]/evidence` | viewer+ | List evidence items for a practice |
| POST | `/api/practices/[id]/evidence` | editor+ | Add a URL (`application/json`) or upload a file (`multipart/form-data`) |
| DELETE | `/api/practices/[id]/evidence/[evidenceId]` | editor+ | Delete one item; sets `evidence_exists = false` if last item |
| GET | `/api/evidence/[...path]` | viewer+ | Stream a stored file from disk |

POST accepts:
- File upload: `multipart/form-data` with `file` + `label` fields
- URL: `{ label: string, url: string }`

On successful POST: DB insert first, then file write, then `UPDATE practices SET evidence_exists = true WHERE practice_id = $1`.
On DELETE of last item: delete file from disk, then `UPDATE practices SET evidence_exists = false WHERE practice_id = $1`.

## Domain Page Changes

The domain page server component adds an evidence count query:

```sql
SELECT practice_id, COUNT(*)::int AS evidence_count
FROM practice_evidence
WHERE practice_id = ANY($1)
GROUP BY practice_id
```

Result merged into practice data before passing to `PracticeTable`. Each practice gains an `evidence_count: number` field.

## UI Components

### Evidence count badge (in PracticeTable)

Replaces the `Switch` for `evidence_exists`. Two states:
- `0 items` — muted border, grey text (no evidence attached)
- `N items` — green border, green text (evidence attached; `evidence_exists` is always true when count > 0)

Clicking the badge opens the `EvidenceDrawer` for that practice.

**Known limitation:** Badge counts reflect the server render. If another user adds/removes evidence concurrently, counts drift until the page is reloaded. This is an accepted v1 limitation.

### EvidenceDrawer component

Client component (`EvidenceDrawer.tsx`). Renders as a fixed right-side panel (300px wide) overlaying the domain page.

State:
- `practiceId: string | null` — null means closed
- `items: EvidenceItem[]` — loaded on open
- `loading: boolean`
- `uploading: boolean`
- `activeTab: 'file' | 'url'`
- `label: string`
- `url: string`

Behaviour:
- Opens when a badge is clicked, closes via × button or Escape key
- On open: fetches `/api/practices/[id]/evidence`
- On add: POST to API, updates local `items` state, notifies parent to increment count
- On delete: DELETE to API, removes from local `items`, notifies parent to decrement count
- Parent `PracticeTable` receives an `onEvidenceCountChange(practiceId, delta)` callback to update badge counts without a full page reload

## File Naming

```
src/app/api/practices/[id]/evidence/route.ts       — GET + POST
src/app/api/practices/[id]/evidence/[eid]/route.ts  — DELETE
src/app/api/evidence/[...path]/route.ts             — file serve
src/components/EvidenceDrawer.tsx                   — drawer UI
src/lib/evidence.ts                                 — file I/O helpers (write, delete, resolve path)
```

## Migration

New migration file: `scripts/migrations/002-evidence.sql` — contains the full `CREATE TABLE` and `CREATE INDEX` statements. Applied manually via `npx tsx scripts/run-migration.ts 002-evidence.sql` or directly with `psql`. The seed script does not add evidence records — evidence is user-supplied data.

## Error Handling

- File too large (>25 MB): 400 `{ error: 'File exceeds 25 MB limit' }`
- Disallowed file type: 400 `{ error: 'File type not allowed' }`
- Invalid practice_id: 400 `{ error: 'Practice not found' }`
- Missing label: 400 `{ error: 'label is required' }`
- Session email missing: 400 `{ error: 'Session missing email' }`
- Path traversal attempt on file serve: 400 `{ error: 'Invalid path' }`
- File write failure after DB insert: DB record rolled back, 500 returned
- Disk read failure on file serve: 500

## Out of Scope (v1)

- Evidence expiry dates
- Bulk upload
- Evidence preview / inline viewer
- Evidence included in data export
- Multi-file upload in one submission
- Concurrent edit conflict resolution (accepted limitation, documented above)
