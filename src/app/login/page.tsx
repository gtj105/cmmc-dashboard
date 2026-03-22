'use client'

import { Suspense, useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function getAuthErrorMessage(errorCode: string | null): string {
  if (!errorCode) return ''
  if (errorCode === 'CredentialsSignin') return 'Invalid email or password'
  if (errorCode === 'AccessDenied') return 'Access denied'
  if (errorCode === 'Configuration') return 'Authentication is temporarily unavailable'
  return 'Authentication error'
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setError(getAuthErrorMessage(searchParams.get('error')))
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        setError(getAuthErrorMessage(result.error))
      } else {
        router.push('/overview')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — brand */}
      <div className="hidden lg:flex w-[420px] shrink-0 flex-col justify-between border-r border-border bg-card p-12">
        <div>
          <span className="text-[11px] font-mono font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            CMMC L2
          </span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-foreground leading-tight tracking-tight mb-5">
            Compliance<br />Tracking<br />Dashboard
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            Gap assessment · Remediation tracking · Audit readiness — across 110 CMMC practices and ITAR overlay controls.
          </p>
        </div>
        <div className="text-[11px] text-muted-foreground font-mono tracking-wide">
          CMMC Level 2 · ITAR · 14 Domains
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">Sign in</h2>
            <p className="text-sm text-muted-foreground">Enter your credentials to access the dashboard</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@localhost"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-xs text-destructive-foreground bg-destructive/20 border border-destructive/30 rounded px-3 py-2">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
