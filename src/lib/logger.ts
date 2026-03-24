// ─────────────────────────────────────────────────────────────────
// Structured Logger — Zero Dependencies
//
// Outputs JSON lines to stdout/stderr. Docker's json-file driver
// captures these, and the log rotation we configured in Phase 1
// (10MB x 5 files per container) keeps disk usage bounded.
//
// Analogy: If console.log is writing notes on random scraps of paper,
// this logger is writing entries in a labeled, dated filing system
// that anyone can search and filter.
//
// Usage:
//   import { logger } from '@/lib/logger'
//   logger.info('practice.updated', { practiceId: 'AC.L2-3.1.1', actor: 'admin@co.com' })
//   logger.security('login.failed', { email: 'attacker@evil.com', reason: 'invalid_password' })
// ─────────────────────────────────────────────────────────────────

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'security'

interface LogEntry {
  timestamp: string
  level: LogLevel
  event: string
  [key: string]: unknown
}

function emit(level: LogLevel, event: string, data?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...data,
  }

  const line = JSON.stringify(entry)

  if (level === 'error' || level === 'security') {
    process.stderr.write(line + '\n')
  } else {
    process.stdout.write(line + '\n')
  }
}

export const logger = {
  debug: (event: string, data?: Record<string, unknown>) => emit('debug', event, data),
  info: (event: string, data?: Record<string, unknown>) => emit('info', event, data),
  warn: (event: string, data?: Record<string, unknown>) => emit('warn', event, data),
  error: (event: string, data?: Record<string, unknown>) => emit('error', event, data),

  /**
   * Security-specific log level for audit events.
   * These go to stderr so they're visible even if stdout is filtered.
   * Covers: login success/failure, user creation, role changes,
   * backup export/import, rate limit triggers, evidence uploads.
   */
  security: (event: string, data?: Record<string, unknown>) =>
    emit('security', event, { ...data, _audit: true }),
}
