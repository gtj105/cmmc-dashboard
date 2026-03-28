import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { existsSync } from 'fs'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────
// Health check endpoint — used by Docker, nginx, and uptime monitors
// No authentication required (must be accessible for health probes)
//
// Returns:
//   200 — all checks pass
//   503 — one or more checks failed (container should be restarted)
// ─────────────────────────────────────────────────────────────────

interface HealthCheck {
  status: 'ok' | 'error'
  latency_ms?: number
  message?: string
}

export async function GET() {
  const checks: Record<string, HealthCheck> = {}
  let healthy = true

  // ─── 1. Database connectivity ───
  const dbStart = Date.now()
  try {
    const [result] = await sql`SELECT 1 AS ping`
    checks.database = {
      status: result?.ping === 1 ? 'ok' : 'error',
      latency_ms: Date.now() - dbStart,
    }
  } catch (err) {
    logger.error('health.db_check_failed', { error: err instanceof Error ? err.message : String(err) })
    checks.database = {
      status: 'error',
      latency_ms: Date.now() - dbStart,
      message: 'Database connection failed',
    }
    healthy = false
  }

  // ─── 2. Evidence volume writable ───
  const evidencePath = '/data/evidence'
  try {
    const exists = existsSync(evidencePath)
    checks.evidence_volume = {
      status: exists ? 'ok' : 'error',
      message: exists ? undefined : 'Volume not mounted',
    }
    if (!exists) healthy = false
  } catch {
    checks.evidence_volume = { status: 'error', message: 'Check failed' }
    healthy = false
  }

  // ─── 3. Memory usage ───
  const mem = process.memoryUsage()
  const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024)
  const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024)
  checks.memory = {
    status: heapUsedMB < 512 ? 'ok' : 'error',
    message: `${heapUsedMB}MB / ${heapTotalMB}MB heap`,
  }
  if (heapUsedMB >= 512) healthy = false

  // ─── Response ───
  const response = {
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
    checks,
  }

  return NextResponse.json(response, {
    status: healthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
