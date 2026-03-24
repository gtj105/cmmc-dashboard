'use client'

import React, { useState } from 'react'
import { apiFetch } from '@/lib/api-client'

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

type CreateForm = { name: string; email: string; password: string; role: string }
const emptyForm = (): CreateForm => ({ name: '', email: '', password: '', role: 'viewer' })

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
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(emptyForm())
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  async function handleDelete(userId: number) {
    setDeleting(userId)
    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        setRows((prev) => prev.filter((r) => r.id !== userId))
      } else {
        const data = await res.json().catch(() => ({}))
        setError({ id: userId, msg: (data as { error?: string }).error ?? 'Failed to delete user.' })
      }
    } catch {
      setError({ id: userId, msg: 'Network error. Failed to delete user.' })
    } finally {
      setDeleting(null)
      setPendingDelete(null)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setCreating(true)
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCreateError((data as { error?: string }).error ?? 'Failed to create user.')
      } else {
        setRows((prev) => [...prev, data as UserRow])
        setCreateForm(emptyForm())
        setShowCreate(false)
      }
    } catch {
      setCreateError('Network error. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  async function handleRoleChange(userId: number, newRole: string) {
    const previous = rows.find((r) => r.id === userId)?.role
    if (!previous || previous === newRole) return

    // Optimistic update
    setError(null)
    setRows((prev) => prev.map((r) => (r.id === userId ? { ...r, role: newRole } : r)))
    setPending(userId)

    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, {
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

  const inputCls = 'w-full border border-border/70 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary'

  return (
    <div className="space-y-4">
      {/* Create user form */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{rows.length} {rows.length === 1 ? 'user' : 'users'}</span>
        <button
          type="button"
          onClick={() => { setShowCreate(v => !v); setCreateError(null) }}
          className="border border-border/80 bg-card/40 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
        >
          {showCreate ? 'Cancel' : 'Create user'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="border border-border bg-card/30 p-4 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">New user</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              required
              type="text"
              placeholder="Full name"
              maxLength={100}
              value={createForm.name}
              onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
              className={inputCls}
            />
            <input
              required
              type="email"
              placeholder="Email address"
              maxLength={254}
              value={createForm.email}
              onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
              className={inputCls}
            />
            <input
              required
              type="password"
              placeholder="Password (min 12 characters)"
              maxLength={128}
              value={createForm.password}
              onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
              className={inputCls}
            />
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm(f => ({ ...f, role: e.target.value }))}
              className={inputCls}
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {createError && (
            <p className="text-xs text-destructive">{createError}</p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="border border-primary/60 bg-primary/10 px-4 py-1.5 text-xs text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create user'}
            </button>
          </div>
        </form>
      )}

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
            <th className="w-24 px-4 py-3" />
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
                  <td className="px-4 py-3 text-right">
                    {!isSelf && (
                      pendingDelete === user.id ? (
                        <span className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={deleting === user.id}
                            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                          >
                            {deleting === user.id ? 'Deleting…' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setPendingDelete(null)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => { setError(null); setPendingDelete(user.id) }}
                          className="text-xs text-muted-foreground transition-colors hover:text-red-400"
                          title="Delete user"
                        >
                          Delete
                        </button>
                      )
                    )}
                  </td>
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
    </div>
  )
}
