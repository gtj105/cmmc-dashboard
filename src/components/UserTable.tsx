'use client'

import React, { useState } from 'react'

export interface UserRow {
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
          (data as { error?: string }).error ?? 'Failed to update role. Try again.'

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
