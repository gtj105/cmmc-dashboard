import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// ─────────────────────────────────────────────────────────────────
// Next.js Edge Middleware
//
// Responsibilities:
//  1. Set CSRF token cookie on every page load
//  2. Redirect unauthenticated users to /login
//  3. Redirect users with mustChangePassword=true to /set-password
//
// Note: JWT token revocation (revoked_tokens table) cannot be checked
// here — Edge runtime has no DB access. Revocation is enforced at the
// API layer via getServerSession() on each authenticated request.
// ─────────────────────────────────────────────────────────────────

const CSRF_COOKIE = 'cmmc-csrf-token'
const TOKEN_LENGTH = 32

// Paths that bypass auth checks entirely
// /api/auth must be here — these are NextAuth's own session/callback/provider
// endpoints. Blocking them prevents NextAuth from ever creating a session.
const PUBLIC_PATHS = ['/login', '/set-password', '/api/auth']

// API prefixes that must_change_password users can still reach
const PASSWORD_CHANGE_ALLOWED_API = ['/api/user/password', '/api/auth']

function generateToken(): string {
  const bytes = new Uint8Array(TOKEN_LENGTH)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always set CSRF cookie (frontend reads it for mutation requests)
  const response = NextResponse.next()
  if (!req.cookies.has(CSRF_COOKIE)) {
    const token = generateToken()
    response.cookies.set(CSRF_COOKIE, token, {
      path: '/',
      sameSite: 'strict',
      httpOnly: false, // Must be readable by JS
      // NODE_ENV=production is true in Docker even over plain HTTP,
      // so check the actual URL scheme instead.
      secure: process.env.NEXTAUTH_URL?.startsWith('https') ?? false,
    })
  }

  // Skip auth checks for public pages
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return response
  }

  // Decode JWT (cryptographic only — no DB call)
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? '',
  })

  // Not authenticated → redirect to login
  if (!token) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Must change password → redirect to /set-password
  // Allow the password API and auth endpoints through so the change can complete
  if (token.mustChangePassword) {
    const isAllowedApi = PASSWORD_CHANGE_ALLOWED_API.some(p => pathname.startsWith(p))
    const isSetPassword = pathname.startsWith('/set-password')
    if (!isAllowedApi && !isSetPassword) {
      const setUrl = req.nextUrl.clone()
      setUrl.pathname = '/set-password'
      return NextResponse.redirect(setUrl)
    }
  }

  return response
}

// Run on all routes except static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
