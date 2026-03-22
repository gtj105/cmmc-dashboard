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
  uploaded_by   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT evidence_has_one_source CHECK (
    (file_path IS NULL) != (url IS NULL)
  )
);

CREATE INDEX practice_evidence_practice_id_idx ON practice_evidence(practice_id);
```

`evidence_exists` on `practices` remains a boolean. App logic sets it to `true` when evidence is added and `false` when the last item is deleted. No DB trigger required.

## File Storage

- Docker named volume `evidence_data` mounted at `/data/evidence/` in the app container
- File path format: `/data/evidence/[practice_id]/[uuid].[ext]`
- Max file size: 25 MB per file, enforced at the API layer
- Files are not included in `export-data` JSON — runbook documents a separate file backup procedure
- `docker-compose.yml` adds the `evidence_data` named volume

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

On successful POST, also runs: `UPDATE practices SET evidence_exists = true WHERE practice_id = $1`
On DELETE of last item: `UPDATE practices SET evidence_exists = false WHERE practice_id = $1`

## Domain Page Changes

The domain page server component adds an evidence count query:

```sql
SELECT practice_id, COUNT(*)::int AS evidence_count
FROM practice_evidence
WHERE practice_id = ANY($1)
GROUP BY practice_id
```

Result merged into practice data before passing to `PracticeTable`. Each practice gains an `evidence_count` field.

## UI Components

### Evidence count badge (in PracticeTable)

Replaces the `Switch` for `evidence_exists`. Each practice row shows a badge:
- `0 items` — muted border, grey text
- `N items` — blue background, blue text (evidence present but `evidence_exists` not set — shouldn't occur)
- `N items ✓` — green border, green text (evidence present and `evidence_exists = true`)

Clicking the badge opens the `EvidenceDrawer` for that practice.

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
- On add: POST to API, updates local `items` state optimistically, notifies parent to update count
- On delete: DELETE to API, removes from local `items`, notifies parent if count reaches 0
- Parent `PracticeTable` receives an `onEvidenceCountChange(practiceId, delta)` callback to update badge counts without a full page reload

## File Naming

```
src/app/api/practices/[id]/evidence/route.ts      — GET + POST
src/app/api/practices/[id]/evidence/[eid]/route.ts — DELETE
src/app/api/evidence/[...path]/route.ts            — file serve
src/components/EvidenceDrawer.tsx                  — drawer UI
src/lib/evidence.ts                                — file I/O helpers
```

## Migration

New migration file: `scripts/migrations/002-evidence.sql`

```sql
CREATE TABLE practice_evidence ( ... );
CREATE INDEX ...;
```

Seed script does not add evidence records — evidence is user-supplied data.

## Error Handling

- File too large (>25 MB): 400 with `{ error: 'File exceeds 25 MB limit' }`
- Invalid practice_id: 400 with `{ error: 'Practice not found' }`
- File serve path traversal attempt: 400 (path sanitized before disk read)
- Disk write failure: 500 (surfaced to error boundary)

## Out of Scope (v1)

- Evidence expiry dates
- Bulk upload
- Evidence preview/inline viewer
- Evidence included in data export
- Multi-file upload in one submission
