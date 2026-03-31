import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// ─────────────────────────────────────────────────────────────────
// Server-side CSRF Validation
// Checks that the x-csrf-token header matches the cookie value.
// ─────────────────────────────────────────────────────────────────

const CSRF_COOKIE = 'cmmc-csrf-token'
const CSRF_HEADER = 'x-csrf-token'

/**
 * Validate CSRF token on a mutating API request.
 * Returns null if valid, or a 403 NextResponse if invalid.
 *
 * Usage at the top of POST/PATCH/DELETE handlers:
 *   const csrfError = checkCsrf(req)
 *   if (csrfError) return csrfError
 */
export function checkCsrf(req: NextRequest): NextResponse | null {
  const method = req.method.toUpperCase()

  // Only validate mutating methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return null

  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value
  const headerToken = req.headers.get(CSRF_HEADER)

  const tokensMatch =
    !!cookieToken &&
    !!headerToken &&
    cookieToken.length === headerToken.length &&
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('crypto').timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))

  if (!tokensMatch) {
    const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    logger.security('csrf.rejected', {
      method,
      path: req.nextUrl.pathname,
      ip,
      hasCookie: !!cookieToken,
      hasHeader: !!headerToken,
    })
    return NextResponse.json(
      { error: 'Invalid or missing CSRF token' },
      { status: 403 }
    )
  }

  return null
}
