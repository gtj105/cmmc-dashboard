import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import sql from '@/lib/db'
import type { UserRole } from '@/lib/types'

const DUMMY_HASH = '$2b$10$dummy.hash.for.timing.protection.placeholder.xxxxx'

// ---------------------------------------------------------------------------
// In-memory login rate limiter (per email address)
// ---------------------------------------------------------------------------
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>()

function isLockedOut(email: string): boolean {
  const rec = loginAttempts.get(email)
  if (!rec) return false
  if (rec.lockedUntil && Date.now() < rec.lockedUntil) return true
  // Expired lockout — reset
  if (rec.lockedUntil && Date.now() >= rec.lockedUntil) loginAttempts.delete(email)
  return false
}

function recordFailure(email: string): void {
  const rec = loginAttempts.get(email) ?? { count: 0, lockedUntil: 0 }
  const count = rec.count + 1
  loginAttempts.set(email, {
    count,
    lockedUntil: count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0,
  })
}

function clearFailures(email: string): void {
  loginAttempts.delete(email)
}
// ---------------------------------------------------------------------------

const ROLE_ORDER: Record<UserRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
}

function normalizeRole(role: unknown): UserRole {
  return role === 'admin' || role === 'editor' ? role : 'viewer'
}

export function hasRole(role: unknown, required: UserRole): boolean {
  return ROLE_ORDER[normalizeRole(role)] >= ROLE_ORDER[required]
}

export function requireRole(
  session: { user?: { role?: string | null } } | null,
  required: UserRole
) {
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasRole(session.user?.role, required)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

function getNextAuthSecret(): string {
  // Support Docker secrets (file-based) with fallback to env var
  const secretFile = process.env.NEXTAUTH_SECRET_FILE
  if (secretFile) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs')
      const secret = fs.readFileSync(secretFile, 'utf8').trim()
      if (secret) return secret
    } catch {
      // Fall through to env var
    }
  }
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required (set NEXTAUTH_SECRET_FILE or NEXTAUTH_SECRET)')
  }
  return secret
}

export function getAuthOptions(): NextAuthOptions {
  return {
    secret: getNextAuthSecret(),
    providers: [
      CredentialsProvider({
        name: 'credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) return null

          const email = credentials.email.toLowerCase().trim()

          if (isLockedOut(email)) {
            throw new Error('TooManyAttempts')
          }

          const [user] = await sql`
            SELECT id, email, password_hash, name, role FROM users WHERE email = ${email}
          `
          if (!user) {
            await bcrypt.compare(credentials.password, DUMMY_HASH)
            recordFailure(email)
            return null
          }
          const valid = await bcrypt.compare(credentials.password, user.password_hash)
          if (!valid) {
            recordFailure(email)
            return null
          }
          clearFailures(email)
          return { id: String(user.id), email: user.email, name: user.name, role: normalizeRole(user.role) }
        },
      }),
    ],
    session: { strategy: 'jwt' },
    pages: { signIn: '/login', error: '/login' },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id
          token.role = normalizeRole('role' in user ? user.role : undefined)
        }
        return token
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string
          session.user.role = normalizeRole(token.role)
        }
        return session
      },
    },
  }
}
