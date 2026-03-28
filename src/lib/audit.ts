import sql from '@/lib/db'
import { logger } from '@/lib/logger'

// ─────────────────────────────────────────────────────────────────
// Security Audit Logger
//
// Dual-writes: structured JSON logs (stdout/stderr) + database table.
// The JSON logs are your real-time monitoring feed.
// The database table is your permanent, queryable audit record.
//
// Analogy: The logger is your security camera's live feed.
// The database table is the recorded footage you can review later.
// ─────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'login.success'
  | 'login.failed'
  | 'login.locked_out'
  | 'user.created'
  | 'user.role_changed'
  | 'user.deleted'
  | 'user.password_changed'
  | 'backup.exported'
  | 'backup.imported'
  | 'factory.reset'
  | 'practice.updated'
  | 'evidence.uploaded'
  | 'evidence.deleted'
  | 'poam.created'
  | 'poam.updated'
  | 'poam.deleted'
  | 'overlay.toggled'
  | 'csrf.rejected'
  | 'settings.updated'

interface AuditData {
  action: AuditAction
  actor?: string           // email or 'system' or 'anonymous'
  target?: string          // what was acted on (user email, practice ID, etc.)
  ip?: string | null       // client IP (from X-Real-IP or X-Forwarded-For)
  details?: string         // human-readable context
  [key: string]: unknown
}

/**
 * Record a security audit event.
 * Writes to both structured logs and the security_events table.
 */
export async function audit(data: AuditData): Promise<void> {
  const { action, actor = 'unknown', target, ip, details, ...extra } = data

  // 1. Structured log (immediate, always works)
  logger.security(action, { actor, target, ip, details, ...extra })

  // 2. Database record (persistent, queryable)
  try {
    await sql`
      INSERT INTO security_events (action, actor, target, ip_address, details)
      VALUES (${action}, ${actor}, ${target ?? null}, ${ip ?? null}, ${details ?? null})
    `
  } catch (err) {
    // Don't let audit logging failures crash the request
    logger.error('audit.db_write_failed', {
      action,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

/**
 * Extract client IP from request headers (nginx sets X-Real-IP).
 */
export function getClientIp(headers: Headers): string | null {
  return headers.get('x-real-ip') ?? headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
}
