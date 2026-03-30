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
  if (role === 'admin') return 'text-amber-400 border border-amber-500/30'
  if (role === 'editor') return 'text-foreground/70 border border-border'
  return 'text-foreground/40 border border-border/50'
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
  const [pendingRoles, setPendingRoles] = useState<Record<number, string>>({})
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

        setRows((prev) => prev.map((r) => (r.id === userId ? { ...r, role: previous } : r)))
        setError({ id: userId, msg })
      }
    } catch {
      setRows((prev) => prev.map((r) => (r.id === userId ? { ...r, role: previous } : r)))
      setError({ id: userId, msg: 'Failed to update role. Try again.' })
    } finally {
      setPending(null)
    }
  }

  function handleRoleSelectChange(userId: number, newRole: string) {
    const current = rows.find((r) => r.id === userId)?.role
    if (newRole === current) {
      setPendingRoles((prev) => { const { [userId]: _, ...rest } = prev; return rest })
    } else {
      setPendingRoles((prev) => ({ ...prev, [userId]: newRole }))
    }
  }

  async function handleRoleSave(userId: number) {
    const newRole = pendingRoles[userId]
    if (!newRole) return
    setPendingRoles((prev) => { const { [userId]: _, ...rest } = prev; return rest })
    await handleRoleChange(userId, newRole)
  }

  function handleRoleCancel(userId: number) {
    setPendingRoles((prev) => { const { [userId]: _, ...rest } = prev; return rest })
  }

  const inputCls = 'w-full border border-border/70 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary'

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/40">{rows.length} {rows.length === 1 ? 'user' : 'users'}</span>
        <button
          type="button"
          onClick={() => { setShowCreate(v => !v); setCreateError(null) }}
          className="border border-border/80 bg-card/40 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
        >
          {showCreate ? 'Cancel' : 'Create user'}
        </button>
      </div>

      {/* Create user form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="space-y-4 border-t border-border pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm text-foreground/70">Full name</label>
              <input
                required
                type="text"
                maxLength={100}
                value={createForm.name}
                onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-foreground/70">Email address</label>
              <input
                required
                type="email"
                maxLength={254}
                value={createForm.email}
                onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-foreground/70">Password</label>
              <input
                required
                type="password"
                maxLength={128}
                value={createForm.password}
                onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                className={inputCls}
              />
              <p className="text-xs text-foreground/40">Minimum 12 characters.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-foreground/70">Role</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm(f => ({ ...f, role: e.target.value }))}
                className={inputCls}
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {createError && (
            <p className="border-l-2 border-destructive pl-3 text-sm text-destructive">{createError}</p>
          )}
          <button
            type="submit"
            disabled={creating}
            className="border border-primary/60 bg-primary/10 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create user'}
          </button>
        </form>
      )}

      {/* Users table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground/40">
              Name
            </th>
            <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground/40">
              Email
            </th>
            <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground/40">
              Role
            </th>
            <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground/40">
              Member Since
            </th>
            <th className="w-24 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((user) => {
            const isSelf = user.id === currentUserId
            const isPending = pending === user.id
            const hasPendingRole = !!pendingRoles[user.id]
            const rowError = error?.id === user.id ? error.msg : null

            return (
              <React.Fragment key={user.id}>
                <tr
                  className="transition-colors hover:bg-card/30"
                  onClick={() => setError(null)}
                >
                  <td className="py-3 pr-4 font-medium text-foreground">{user.name}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-foreground/50">{user.email}</td>
                  <td className="py-3 pr-4">
                    {isSelf ? (
                      <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium ${roleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          value={pendingRoles[user.id] ?? user.role}
                          disabled={isPending}
                          onChange={(e) => handleRoleSelectChange(user.id, e.target.value)}
                          className="border border-border bg-background px-2 py-1 text-xs text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Change role for ${user.name}`}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        {hasPendingRole && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleRoleSave(user.id) }}
                              className="text-xs text-foreground/80 underline underline-offset-2 hover:text-foreground"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleRoleCancel(user.id) }}
                              className="text-xs text-foreground/40 hover:text-foreground/70"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-foreground/50">{formatDate(user.created_at)}</td>
                  <td className="py-3 text-right">
                    {!isSelf && (
                      pendingDelete === user.id ? (
                        <span className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDelete(user.id) }}
                            disabled={deleting === user.id}
                            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                          >
                            {deleting === user.id ? 'Deleting…' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPendingDelete(null) }}
                            className="text-xs text-foreground/40 hover:text-foreground/70"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setError(null); setPendingDelete(user.id) }}
                          className="text-xs text-foreground/40 transition-colors hover:text-red-400"
                        >
                          Delete
                        </button>
                      )
                    )}
                  </td>
                </tr>
                {rowError && (
                  <tr>
                    <td colSpan={5} className="border-l-2 border-destructive py-2 pl-3 text-xs text-destructive">
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
