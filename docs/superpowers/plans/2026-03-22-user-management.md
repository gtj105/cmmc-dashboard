# User Management UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give admins a UI page at `/admin/users` to view all dashboard users and change their roles without touching the database CLI.

**Architecture:** Server-component-first. The page fetches users server-side with an admin-only auth guard (redirect non-admins to `/overview`). `UserTable` is the only client island — it owns the role-change interaction with optimistic updates and inline error display. A `PATCH /api/admin/users/[id]` route handles mutations, also admin-only.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, postgres.js, NextAuth v4, `getServerSession` + `requireRole` from `src/lib/auth.ts`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/app/api/admin/users/[id]/route.ts` | Create | PATCH endpoint: auth, validate, update role, return user |
| `src/components/UserTable.tsx` | Create | Client component: role select per row, optimistic update, inline errors |
| `src/app/admin/users/page.tsx` | Create | Server component: admin-only, fetch users, render page with UserTable |
| `src/components/layout/AppShell.tsx` | Modify | Pass `session?.user?.role` to Sidebar |
| `src/components/layout/Sidebar.tsx` | Modify | Accept `role?: string` prop, conditionally render Admin section |

> **Note:** `src/app/report/PrintButton.tsx` and `src/app/report/page.tsx` from the Assessment Report plan also add a `/report` NavItem to Sidebar. If executing both plans, the Sidebar task here should be done last and should include the `/report` NavItem too (it is included below).

---

## Task 1: PATCH API Route

**Files:**
- Create: `src/app/api/admin/users/[id]/route.ts`

- [ ] **Step 1: Create the route file with full implementation**

```typescript
// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions, requireRole } from '@/lib/auth'
import { sql } from '@/lib/db'
import { USER_ROLE_VALUES } from '@/lib/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(getAuthOptions())
  const authError = requireRole(session, 'admin')
  if (authError) return authError

  const id = parseInt(params.id, 10)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { role } = body as { role?: unknown }
  if (typeof role !== 'string' || !USER_ROLE_VALUES.includes(role as typeof USER_ROLE_VALUES[number])) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // Prevent self-role-change
  const currentId = (session!.user as { id?: number }).id
  if (typeof currentId !== 'number') {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  if (currentId === id) {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 403 })
  }

  try {
    const [updated] = await sql<{ id: number; email: string; name: string; role: string; created_at: string }[]>`
      UPDATE users
      SET role = ${role}
      WHERE id = ${id}
      RETURNING id, email, name, role, created_at
    `
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Next.js App Router automatically returns 405 for unhandled methods.
// Explicitly handle the most-likely ones for clarity.
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /path/to/dashboard && npx tsc --noEmit`
Expected: No errors on the new file (ignore pre-existing errors if any).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/users/[id]/route.ts
git commit -m "feat: add PATCH /api/admin/users/[id] route for admin role management"
```

---

## Task 2: UserTable Client Component

**Files:**
- Create: `src/components/UserTable.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/UserTable.tsx
'use client'

import React, { useState } from 'react'

interface UserRow {
  id: number
  email: string
  name: string
  role: string
  created_at: string
}

interface UserTableProps {
  users: UserRow[]
  currentUserId: number
}

const ROLES = ['viewer', 'editor', 'admin'] as const

function roleBadgeClass(role: string): string {
  if (role === 'admin') return 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
  if (role === 'editor') return 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
  return 'bg-muted/40 text-muted-foreground border border-border'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function UserTable({ users, currentUserId }: UserTableProps) {
  const [rows, setRows] = useState<UserRow[]>(users)
  const [pending, setPending] = useState<number | null>(null)
  const [error, setError] = useState<{ id: number; msg: string } | null>(null)

  async function handleRoleChange(userId: number, newRole: string) {
    const previous = rows.find((r) => r.id === userId)?.role
    if (!previous || previous === newRole) return

    // Optimistic update
    setError(null)
    setRows((prev) => prev.map((r) => (r.id === userId ? { ...r, role: newRole } : r)))
    setPending(userId)

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg =
          res.status === 403 ? 'You cannot change your own role.' :
          res.status === 400 ? 'Invalid role value.' :
          res.status === 404 ? 'User not found.' :
          res.status === 401 ? 'Session expired. Please refresh the page.' :
          data.error ?? 'Failed to update role. Try again.'

        // Revert
        setRows((prev) => prev.map((r) => (r.id === userId ? { ...r, role: previous } : r)))
        setError({ id: userId, msg })
      }
    } catch {
      // Network error — revert
      setRows((prev) => prev.map((r) => (r.id === userId ? { ...r, role: previous } : r)))
      setError({ id: userId, msg: 'Failed to update role. Try again.' })
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-card/60">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Member Since
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((user) => {
            const isSelf = user.id === currentUserId
            const isPending = pending === user.id
            const rowError = error?.id === user.id ? error.msg : null

            return (
              <React.Fragment key={user.id}>
                <tr
                  className="bg-card/20 transition-colors hover:bg-card/40"
                  onClick={() => setError(null)}
                >
                  <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold ${roleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                      <select
                        value={user.role}
                        disabled={isSelf || isPending}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="rounded-sm border border-border bg-background px-2 py-1 text-xs text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Change role for ${user.name}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(user.created_at)}</td>
                </tr>
                {rowError && (
                  <tr className="bg-destructive/5">
                    <td colSpan={4} className="px-4 py-2 text-xs text-destructive">
                      {rowError}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors on the new file.

- [ ] **Step 3: Commit**

```bash
git add src/components/UserTable.tsx
git commit -m "feat: add UserTable client component with optimistic role-change"
```

---

## Task 3: Admin Users Page (Server Component)

**Files:**
- Create: `src/app/admin/users/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
// src/app/admin/users/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import AppShell from '@/components/layout/AppShell'
import UserTable from '@/components/UserTable'

export const dynamic = 'force-dynamic'

interface UserRow {
  id: number
  email: string
  name: string
  role: string
  created_at: string
}

export default async function AdminUsersPage() {
  const session = await getServerSession(getAuthOptions())
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    redirect('/overview')
  }

  const orgName = process.env.ORG_NAME ?? 'My Organization'
  const currentUserId = (session.user as { id?: number }).id ?? 0

  const users = await sql<UserRow[]>`
    SELECT id, email, name, role, created_at
    FROM users
    ORDER BY created_at ASC
  `

  return (
    <AppShell orgName={orgName}>
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage dashboard access roles.</p>
        </div>

        <UserTable users={users} currentUserId={currentUserId} />
      </div>
    </AppShell>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/users/page.tsx
git commit -m "feat: add /admin/users page with server-side auth guard and user list"
```

---

## Task 4: Sidebar + AppShell — Role-Aware Nav

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/AppShell.tsx`

This task combines two related changes: passing `role` through AppShell to Sidebar, then conditionally rendering the Admin section. It also adds the `/report` NavItem under Program Management (from the Assessment Report plan — combine here to avoid a merge conflict).

- [ ] **Step 1: Update Sidebar to accept role prop + add Admin section + add Report link**

In `src/components/layout/Sidebar.tsx`, change the export signature and add both the Report link and Admin section:

```diff
-export default function Sidebar({ orgName }: { orgName: string }) {
+export default function Sidebar({ orgName, role }: { orgName: string; role?: string }) {
```

Under the `Activity Log` NavItem (line 98–99), add the Report link and the Admin section:

```tsx
        <NavItem href="/activity" active={pathname === '/activity'}>
          Activity Log
        </NavItem>
        <NavItem href="/report" active={pathname === '/report'}>
          Assessment Report
        </NavItem>

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

- [ ] **Step 2: Update AppShell to pass role to Sidebar**

In `src/components/layout/AppShell.tsx`, change the Sidebar render line:

```diff
-      <Sidebar orgName={orgName} />
+      <Sidebar orgName={orgName} role={(session?.user as { role?: string })?.role} />
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/components/layout/AppShell.tsx
git commit -m "feat: add role-aware Admin nav section and Assessment Report link to sidebar"
```

---

## Manual Verification Checklist

After all tasks are complete:

- [ ] Log in as admin → Sidebar shows "Admin" section with "Users" link
- [ ] Log in as viewer/editor → Sidebar does NOT show "Admin" section
- [ ] Visit `/admin/users` as admin → user table renders, all users visible
- [ ] Visit `/admin/users` as viewer/editor → redirected to `/overview`
- [ ] Change a non-self user's role → optimistic update, badge updates immediately
- [ ] Try to change your own role → select is disabled; no error state triggered
- [ ] Verify API rejects non-admin: send `PATCH /api/admin/users/1` as viewer → 401/403
- [ ] "Assessment Report" link appears in sidebar for all authenticated users
