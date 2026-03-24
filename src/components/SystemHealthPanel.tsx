'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'

interface HealthCheck {
  status: 'ok' | 'error'
  latency_ms?: number
  message?: string
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime_seconds: number
  checks: Record<string, HealthCheck>
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function checkLabel(key: string): string {
  const labels: Record<string, string> = {
    database: 'Database',
    evidence_volume: 'Evidence Volume',
    memory: 'Memory',
  }
  return labels[key] ?? key
}

export default function SystemHealthPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchHealth = useCallback(async () => {
    try {
      const res = await apiFetch('/api/health')
      const data: HealthResponse = await res.json()
      setHealth(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reach health endpoint')
      setHealth(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
    if (!autoRefresh) return
    const interval = setInterval(fetchHealth, 15_000) // 15s
    return () => clearInterval(interval)
  }, [fetchHealth, autoRefresh])

  const statusDot = (s: 'ok' | 'error') =>
    s === 'ok' ? 'bg-green-500' : 'bg-red-500'

  const overallColor =
    health?.status === 'healthy' ? 'text-green-400' : 'text-red-400'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Real-time system checks. The health endpoint is also used by Docker for automatic container restarts.
        </p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="accent-sky-500"
            />
            Auto-refresh (15s)
          </label>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="border border-border/80 bg-card/40 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check now'}
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-red-900/60 bg-red-950/20 p-4">
          <p className="text-xs font-semibold text-red-400">Health check unreachable</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
          <p className="text-[11px] text-muted-foreground mt-2">
            This means the application server is down or not responding. Check Docker container status.
          </p>
        </div>
      )}

      {health && (
        <>
          {/* Overall status banner */}
          <div className="border border-border bg-card/30 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  health.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <div>
                <p className={`text-sm font-semibold ${overallColor}`}>
                  {health.status === 'healthy' ? 'All systems operational' : 'System degraded'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Uptime: {formatUptime(health.uptime_seconds)}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Last checked: {new Date(health.timestamp).toLocaleTimeString()}
            </p>
          </div>

          {/* Individual checks */}
          <div className="grid gap-4 sm:grid-cols-3">
            {Object.entries(health.checks).map(([key, check]) => (
              <div key={key} className="border border-border bg-card/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{checkLabel(key)}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${statusDot(check.status)}`} />
                    <span
                      className={`text-[11px] font-medium ${
                        check.status === 'ok' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {check.status === 'ok' ? 'OK' : 'Error'}
                    </span>
                  </div>
                </div>
                {check.latency_ms !== undefined && (
                  <p className="text-[11px] text-muted-foreground">
                    Latency: {check.latency_ms}ms
                  </p>
                )}
                {check.message && (
                  <p className="text-[11px] text-muted-foreground">{check.message}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
