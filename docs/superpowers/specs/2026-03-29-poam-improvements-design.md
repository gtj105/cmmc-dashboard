# POAM Improvements — Design Spec

**Goal:** Make POAMs more durable (soft-delete, change history) and easier to enter (structured fields, create from practice page).

**Architecture:** New `poam_history` table mirrors `practice_history`. `poam_items` gains 4 structured text columns replacing the single `finding` field, plus a `deleted_at` soft-delete column. API and UI updated throughout.

**Date:** 2026-03-29

---

## Data Model

### `poam_items` table changes

Replace the single `finding TEXT` column with four structured columns:

| Column | Type | Required | Notes |
|---|---|---|---|
| `gap_statement` | TEXT | Yes (on create) | Replaces `finding` |
| `root_cause` | TEXT | No | |
| `remediation_plan` | TEXT | No | |
| `closure_evidence` | TEXT | No | |

Add soft-delete column:

| Column | Type | Notes |
|---|---|---|
| `deleted_at` | TIMESTAMPTZ NULL | NULL = active; timestamp = archived |

**Migration:** Existing `finding` content moves to `gap_statement`. `root_cause`, `remediation_plan`, `closure_evidence` default to NULL for existing rows.

### New `poam_history` table

```sql
CREATE TABLE poam_history (
  id            SERIAL PRIMARY KEY,
  poam_id       INTEGER NOT NULL REFERENCES poam_items(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  old_value     TEXT,
  new_value     TEXT,
  changed_by    TEXT NOT NULL,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX poam_history_poam_id_idx ON poam_history (poam_id);
```

Mirrors the existing `practice_history` table. One row per changed field per PATCH request.

---

## API Changes

### `POST /api/poam` (create)

- Accept `gap_statement` (required, 1–5000 chars), `root_cause`, `remediation_plan`, `closure_evidence` (all optional, max 5000 chars each) instead of `finding`
- All other fields unchanged: `practice_id`, `responsible_individual`, `resources_required`, `scheduled_completion`, `milestone_progress`, `status`
- Validate: `gap_statement` required; structured fields max 5000 chars each

### `PATCH /api/poam/[id]` (edit)

- Accept any of the 4 structured fields plus existing fields as partial updates
- After saving, compare old vs new values and write one `poam_history` row per changed field (skip unchanged fields)
- Return updated item

### `DELETE /api/poam/[id]` → soft-delete

- Set `deleted_at = NOW()` instead of hard-deleting the row
- Admin only + CSRF (same as current)
- Returns 200 with the archived item

### `POST /api/poam/[id]/restore` (new)

- Clears `deleted_at` (sets to NULL)
- Admin only + CSRF
- Returns 200 with the restored item

### `GET /api/poam` (list)

- Default: `WHERE deleted_at IS NULL`
- Query param `?include_archived=true` (admin only): returns all items including archived; archived items include `deleted_at` timestamp

### `GET /api/poam/[id]/history` (new)

- Returns all `poam_history` rows for the POAM, ordered newest first
- Authenticated, any role

---

## UI Changes

### Structured create / edit form

Four labeled textarea sections in order, replacing the single finding textarea:

1. **Gap Statement** — required on create; full textarea
2. **Root Cause** — optional textarea
3. **Remediation Plan** — optional textarea; hint text "Required to close" shown when status is being set to Closed
4. **Closure Evidence** — optional textarea; same hint when closing

### Soft-delete (archive) flow

- Rename delete button to **Archive** (archive icon)
- Clicking shows inline confirmation below the button: "Archive this item? It can be restored by an admin." with Confirm / Cancel — no modal
- Archived items disappear from the main table view
- Admin-only **"Show archived"** toggle above the table — reveals archived rows in a muted style with a **Restore** button

### Change history panel

- Each POAM row shows a **History** link (with a count badge if changes > 0)
- Clicking expands an inline panel below the row with a timeline list:
  `[date] [user] changed [field]: "[old]" → "[new]"`
- Lazy-loaded from `GET /api/poam/[id]/history` on first open
- Collapses when clicked again

### Create from practice page

- **"Add POA&M"** button on the practice detail page (editor+ only, same role gate as practice edits)
- Opens the POAM create form (inline or slide-over) pre-filled with the practice ID
- On save: stays on the practice page, shows a success toast; does not navigate to the POAM page

---

## Out of Scope

- File uploads on POAM closure evidence (evidence files stay with practices)
- Bulk create from failing practices
- POAM export / print view
- Email notifications on POAM status change
