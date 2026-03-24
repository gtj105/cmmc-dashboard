import { NextRequest, NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────
// Next.js Edge Middleware
// Sets CSRF token cookie on every page load so the frontend
// can read it and include it as a header on API requests.
// ─────────────────────────────────────────────────────────────────

const CSRF_COOKIE = 'cmmc-csrf-token'
const TOKEN_LENGTH = 32

function generateToken(): string {
  const bytes = new Uint8Array(TOKEN_LENGTH)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function middleware(req: NextRequest) {
  const response = NextResponse.next()

  // Only set cookie if not already present (don't rotate on every request)
  if (!req.cookies.has(CSRF_COOKIE)) {
    const token = generateToken()
    response.cookies.set(CSRF_COOKIE, token, {
      path: '/',
      sameSite: 'strict',
      httpOnly: false,  // Frontend must read this cookie
      // Only require Secure if explicitly running with HTTPS.
      // NODE_ENV=production is true in Docker even over plain HTTP,
      // so we check for the actual URL scheme instead.
      secure: process.env.NEXTAUTH_URL?.startsWith('https') ?? false,
    })
  }

  return response
}

// Run on all page routes (not static assets or API routes)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
