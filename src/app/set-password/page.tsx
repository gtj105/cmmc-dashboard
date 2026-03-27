'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api-client'
import { Button } from '@/components/ui/button'

export default function SetPasswordPage() {
  const { data: session, update } = useSession()
  const router = useRouter()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const user = session?.user as { name?: string; email?: string; mustChangePassword?: boolean } | undefined
  const isForced = user?.mustChangePassword === true

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (next !== confirm) {
      setError('New passwords do not match.')
      return
    }
    if (next.length < 12) {
      setError('Password must be at least 12 characters.')
      return
    }

    setLoading(true)
    try {
      const res = await apiFetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })

      if (res.ok || res.status === 204) {
        // Force a session refresh so mustChangePassword is cleared in the JWT.
        // The flag is cleared in the DB — re-login picks up the updated value.
        await update()
        // Re-sign in to get a fresh token without mustChangePassword
        await signOut({ redirect: false })
        router.push('/login?reason=password-changed')
      } else {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Failed to update password.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex w-[420px] shrink-0 flex-col justify-between border-r border-border bg-card p-12">
        <div>
          <span className="text-[11px] font-mono font-semibold tracking-[0.18em] text-sky-400/70 uppercase">
            CMMC L2
          </span>
        </div>
        <div>
          <h1 className="text-4xl font-semibold text-foreground leading-tight tracking-tight mb-5">
            Compliance<br />Tracking<br />Dashboard
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            Secure access requires a unique password. This step cannot be skipped.
          </p>
        </div>
        <div className="text-[11px] text-muted-foreground font-mono tracking-wide">
          CMMC Level 2 · ITAR · 14 Domains
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">Set your password</h2>
            {isForced ? (
              <p className="text-sm text-muted-foreground">
                Your account was created with a temporary password.
                Set a permanent one to continue.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Change your current password below.
              </p>
            )}
          </div>

          {isForced && (
            <div className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-2">
              You must change your password before accessing the dashboard.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="current" className="text-xs text-muted-foreground">
                Current password
              </label>
              <input
                id="current"
                type="password"
                placeholder="••••••••"
                value={current}
                onChange={e => setCurrent(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full border border-border/70 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="new" className="text-xs text-muted-foreground">
                New password <span className="text-muted-foreground/60">(min 12 characters)</span>
              </label>
              <input
                id="new"
                type="password"
                placeholder="••••••••"
                value={next}
                onChange={e => setNext(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full border border-border/70 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm" className="text-xs text-muted-foreground">
                Confirm new password
              </label>
              <input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full border border-border/70 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive-foreground bg-destructive/20 border border-destructive/30 px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Set password'}
            </Button>
          </form>

          {!isForced && (
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full text-xs text-muted-foreground hover:text-foreground text-center"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
