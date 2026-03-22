# User Management UI — Design Spec

**Date:** 2026-03-22
**Status:** Approved — ready to build
**Scope:** v1 — role management only, no deletion, no password reset

---

## Goal

Give admins a single page to view all dashboard users and change their roles without touching the database CLI. Viewers and editors have no access to this page.

---

## Architecture

```
src/
  app/
    admin/
      users/
        page.tsx              ← Server component, admin-only
    api/
      admin/
        users/
          [id]/
            route.ts          ← PATCH handler, admin-only
  components/
    UserTable.tsx             ← Client component, role-change mutation + optimistic update
```

**Rendering strategy:** Server-component-first. The page fetches users server-side (no loading state needed). `UserTable` is the only client island — it owns the role-change interaction.

**Auth flow:**
1. Page calls `getServerSession(getAuthOptions())`.
2. If no session or `session.user.role !== 'admin'`, call `redirect('/overview')`.
3. No `requireRole` helper needed on the page; use `redirect` directly (server component pattern).
4. API route uses `requireRole(session, 'admin')` and returns the error response if non-null.

---

## Data Model

Users table (confirmed from `scripts/seed.ts`):

```sql
CREATE TABLE users (
  id           SERIAL PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'viewer'
                 CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Valid role values come from `USER_ROLE_VALUES` in `src/lib/types.ts` — assumed to be `['viewer', 'editor', 'admin']` (seed inserts admin with `'admin'`; `requireRole` enforces ordering). The API must validate against this same constant.

The `password_hash` column is never exposed to the frontend.

---

## API Routes

### `PATCH /api/admin/users/[id]`

**File:** `src/app/api/admin/users/[id]/route.ts`

**Request body:**
```json
{ "role": "editor" }
```

**Logic:**
1. Get session via `getServerSession(getAuthOptions())`.
2. Call `requireRole(session, 'admin')` — return error response if non-null.
3. Parse `id` from params (must be a positive integer).
4. Parse body; validate `role` is one of `USER_ROLE_VALUES`. Return `400` with `{ error: 'Invalid role' }` if not.
5. Prevent self-role-change: if `session.user.id === id`, return `403` with `{ error: 'Cannot change your own role' }`.
6. Execute: `UPDATE users SET role = $role WHERE id = $id RETURNING id, email, name, role, created_at`.
7. If no rows returned, return `404` with `{ error: 'User not found' }`.
8. Return `200` with the updated user row (excluding `password_hash`).

**Error responses:**

| Status | Body |
|--------|------|
| 401 | `{ error: 'Unauthorized' }` |
| 403 | `{ error: 'Forbidden' }` or `{ error: 'Cannot change your own role' }` |
| 400 | `{ error: 'Invalid role' }` |
| 404 | `{ error: 'User not found' }` |
| 500 | `{ error: 'Internal server error' }` |

No other methods are handled in v1. Return `405` for anything other than PATCH.

---

## UI Components

### `src/app/admin/users/page.tsx` — Server Component

```
/admin/users
```

- Call `getServerSession(getAuthOptions())`. If not admin, `redirect('/overview')`.
- Query: `SELECT id, email, name, role, created_at FROM users ORDER BY created_at ASC`.
- Pass `users` array and `currentUserId` (from `session.user.id`) to `<UserTable>`.
- Page title: "Users" with subtext "Manage dashboard access roles."
- Layout: uses existing `<Sidebar>` + page shell (same `flex h-screen` pattern as `/overview`).

### `src/components/UserTable.tsx` — Client Component

Props:
```ts
interface UserTableProps {
  users: {
    id: number
    email: string
    name: string
    role: string
    created_at: string   // ISO string from server
  }[]
  currentUserId: number
}
```

**Table columns:**
| Column | Notes |
|--------|-------|
| Name | `font-medium text-foreground` |
| Email | `text-muted-foreground text-sm font-mono` (IBM Plex Mono) |
| Role | Colored badge + select dropdown (see below) |
| Member Since | `created_at` formatted as `MMM D, YYYY` |

**Role badge colors:**
- `admin` — amber/orange: `bg-amber-500/15 text-amber-400 border border-amber-500/30`
- `editor` — sky blue: `bg-sky-500/15 text-sky-400 border border-sky-500/30`
- `viewer` — muted: `bg-muted/40 text-muted-foreground border border-border`

**Role select dropdown (per row):**
- A `<select>` element showing current role; options: viewer, editor, admin.
- Disabled (and visually dimmed) when `user.id === currentUserId`.
- On `onChange`: call `PATCH /api/admin/users/[id]` with `{ role }`.
- Optimistic update: update local state immediately; revert to previous value on error.
- While the request is in-flight, disable the select to prevent double-submit.
- On error: show an inline error message below the row (text-destructive, dismissed on next interaction).

**State shape:**
```ts
const [rows, setRows] = useState(users)
const [pending, setPending] = useState<number | null>(null)   // user id being updated
const [error, setError] = useState<{ id: number; msg: string } | null>(null)
```

**No toast library** — inline error text only, consistent with existing pattern in the codebase.

---

## Sidebar Change

**File:** `src/components/layout/Sidebar.tsx`

The component currently accepts `orgName` as a prop and has no session awareness. To conditionally show the Admin section, pass `role` as an additional prop.

**Prop change:**
```ts
// Before
export default function Sidebar({ orgName }: { orgName: string })

// After
export default function Sidebar({ orgName, role }: { orgName: string; role?: string })
```

The server layout (wherever `<Sidebar>` is rendered) passes `session?.user?.role` as the `role` prop.

**New section — append after "Program Management":**
```tsx
{role === 'admin' && (
  <>
    <div className="px-3 py-2 mt-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Admin
      </span>
    </div>
    <NavItem href="/admin/users" active={pathname === '/admin/users'}>
      Users
    </NavItem>
  </>
)}
```

The section label uses the same muted style as "CMMC Domains" (not the amber style of "Program Management").

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Non-admin visits `/admin/users` | Server redirect to `/overview` |
| PATCH returns 403 (own role) | `select` reverts; inline error: "You cannot change your own role." |
| PATCH returns 400 (invalid role) | `select` reverts; inline error: "Invalid role value." |
| PATCH returns 404 | `select` reverts; inline error: "User not found." |
| PATCH returns 500 or network error | `select` reverts; inline error: "Failed to update role. Try again." |
| Session expires mid-session | PATCH returns 401; inline error prompts page refresh |

All error messages are cleared when the user next interacts with any select.

---

## Out of Scope (v1)

- User deletion — not in v1
- Password reset — still CLI only (`scripts/seed.ts` pattern)
- User creation via UI — CLI only
- Invite flow / email — not planned
- Audit log of role changes — could use existing `practice_history` pattern in a future spec
- Pagination — user count is small; full list is fine
- Search / filter — not needed in v1
- Bulk role changes — not needed in v1
- `/api/admin/users` (GET list) — page fetches directly from DB server-side; no REST list endpoint needed
