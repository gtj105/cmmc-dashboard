import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'

// ─────────────────────────────────────────────────────────────────
// CSRF Protection — Double Submit Cookie Pattern
//
// How it works (analogy: a wax seal on a letter):
//   1. When the app loads, the server sets a random CSRF token in a cookie
//   2. The frontend reads this cookie and includes it as a header on every request
//   3. The server checks that the header matches the cookie
//
// Why this stops attacks:
//   A malicious site can SEND cookies (browser does it automatically),
//   but it can't READ cookies from another domain. So it can't copy
//   the token into the custom header. The mismatch = blocked request.
// ─────────────────────────────────────────────────────────────────

const CSRF_COOKIE = 'cmmc-csrf-token'
const CSRF_HEADER = 'x-csrf-token'
const TOKEN_LENGTH = 32

/** Generate a cryptographically random hex token */
function generateToken(): string {
  const bytes = new Uint8Array(TOKEN_LENGTH)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Extract CSRF token from the cookie header string */
function getTokenFromCookie(req: NextRequest): string | null {
  return req.cookies.get(CSRF_COOKIE)?.value ?? null
}

/**
 * Validate CSRF token on mutating requests (POST, PATCH, PUT, DELETE).
 * Returns null if valid, or a NextResponse error if invalid.
 *
 * Call this at the top of any mutating API route handler.
 */
export async function validateCsrf(req: NextRequest): Promise<NextResponse | null> {
  const method = req.method.toUpperCase()

  // Only validate mutating methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return null

  // Skip CSRF for NextAuth internal routes (it has its own CSRF)
  if (req.nextUrl.pathname.startsWith('/api/auth/')) return null

  // Must be authenticated to need CSRF protection
  const session = await getServerSession(getAuthOptions())
  if (!session) return null  // Auth check will catch this separately

  const cookieToken = getTokenFromCookie(req)
  const headerToken = req.headers.get(CSRF_HEADER)

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json(
      { error: 'Invalid or missing CSRF token' },
      { status: 403 }
    )
  }

  return null
}

/**
 * Generate a CSRF token response cookie.
 * Call this from GET endpoints or middleware to set the cookie.
 */
export function csrfCookieHeaders(): Record<string, string> {
  const token = generateToken()
  const isSecure = process.env.NEXTAUTH_URL?.startsWith('https') ?? false
  const securePart = isSecure ? '; Secure' : ''
  // HttpOnly=false so JavaScript can read it and send as header
  // SameSite=Strict prevents the cookie from being sent in cross-site requests
  return {
    'Set-Cookie': `${CSRF_COOKIE}=${token}; Path=/; SameSite=Strict; HttpOnly=false${securePart}`,
  }
}

/** Get the cookie name for use in frontend code */
export const CSRF_COOKIE_NAME = CSRF_COOKIE
export const CSRF_HEADER_NAME = CSRF_HEADER
