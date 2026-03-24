'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'

const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? 'My Organization'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
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
