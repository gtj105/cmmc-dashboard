'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api-client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [orgName, setOrgName] = useState('My Organization')
  const [orgNameInput, setOrgNameInput] = useState('')
  const [orgSaving, setOrgSaving] = useState(false)
  const [orgError, setOrgError] = useState<string | null>(null)
  const [orgSuccess, setOrgSuccess] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isAdmin = (session?.user as { role?: string })?.role === 'admin'

  useEffect(() => {
    if (status !== 'authenticated' || !isAdmin) return
    apiFetch('/api/admin/settings')
      .then(r => r.ok ? r.json() : null)
      .then((data: { org_name?: string } | null) => {
        if (data?.org_name) {
          setOrgName(data.org_name)
          setOrgNameInput(data.org_name)
        }
      })
      .catch(() => null)
  }, [status, isAdmin])

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  async function handleOrgSubmit(e: React.FormEvent) {
    e.preventDefault()
    setOrgError(null)
    setOrgSuccess(false)
    setOrgSaving(true)
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_name: orgNameInput }),
      })
      if (res.ok) {
        const data = await res.json() as { org_name: string }
        setOrgName(data.org_name)
        setOrgSuccess(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setOrgError((data as { error?: string }).error ?? 'Failed to update.')
      }
    } catch {
      setOrgError('Network error. Please try again.')
    } finally {
      setOrgSaving(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    setSaving(true)
    try {
      const res = await apiFetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (res.ok || res.status === 204) {
        setSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Failed to update password.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full border border-border/70 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary'

  return (
    <AppShell orgName={orgName}>
      <div className="space-y-6">
        <div className="border-b border-border pb-4">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as <span className="text-foreground">{session?.user?.email}</span>
          </p>
        </div>

        {isAdmin && (
          <div className="max-w-md space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Organization
            </h2>
            <form onSubmit={handleOrgSubmit} className="border border-border bg-card/30 p-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Organization name</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={orgNameInput}
                  onChange={(e) => setOrgNameInput(e.target.value)}
                  className={inputCls}
                />
              </div>
              {orgError && <p className="text-xs text-destructive">{orgError}</p>}
              {orgSuccess && <p className="text-xs text-green-400">Organization name updated.</p>}
              <div className="flex justify-end pt-1">
                <Button type="submit" size="sm" className="h-8 text-xs" disabled={orgSaving}>
                  {orgSaving ? 'Saving…' : 'Update name'}
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="max-w-md space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Change Password
          </h2>

          <form onSubmit={handleSubmit} className="border border-border bg-card/30 p-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Current password</label>
              <input
                type="password"
                required
                maxLength={128}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">New password <span className="text-muted-foreground/60">(min 12 characters)</span></label>
              <input
                type="password"
                required
                maxLength={128}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Confirm new password</label>
              <input
                type="password"
                required
                maxLength={128}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className={inputCls}
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            {success && (
              <p className="text-xs text-green-400">Password updated successfully.</p>
            )}

            <div className="flex justify-end pt-1">
              <Button type="submit" size="sm" className="h-8 text-xs" disabled={saving}>
                {saving ? 'Saving…' : 'Update password'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
