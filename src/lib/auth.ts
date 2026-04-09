import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import sql from '@/lib/db'
import { logger } from '@/lib/logger'
import { audit } from '@/lib/audit'
import { revokeToken } from '@/lib/token-revocation'
import type { UserRole } from '@/lib/types'

const DUMMY_HASH = '$2a$13$CjqYzfTQZwwfPtc9EfFKNupVWf1l5/ZiW3KJWB1rhy2HatgkjaJMS'

// JWT maxAge — tokens are valid for 8 hours
const JWT_MAX_AGE_SECONDS = 8 * 60 * 60

// Sessions idle longer than this are rejected server-side
export const INACTIVITY_TIMEOUT_SECONDS = 30 * 60  // 30 minutes

// ---------------------------------------------------------------------------
// DB-backed login rate limiter (per email address)
// ---------------------------------------------------------------------------
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes

async function isLockedOut(email: string): Promise<boolean> {
  const [rec] = await sql<{ count: number; locked_until: Date | null }[]>`
    SELECT count, locked_until FROM login_attempts WHERE email = ${email}
  `
  if (!rec) return false
  if (rec.locked_until && new Date(rec.locked_until) > new Date()) return true
  if (rec.locked_until && new Date(rec.locked_until) <= new Date()) {
    await sql`DELETE FROM login_attempts WHERE email = ${email}`
  }
  return false
}

async function recordFailure(email: string): Promise<void> {
  await sql`
    INSERT INTO login_attempts (email, count, locked_until)
    VALUES (${email}, 1, NULL)
    ON CONFLICT (email) DO UPDATE
      SET count = login_attempts.count + 1,
          locked_until = CASE
            WHEN login_attempts.count + 1 >= ${MAX_ATTEMPTS}
            THEN NOW() + INTERVAL '15 minutes'
            ELSE NULL
          END
  `
}

async function clearFailures(email: string): Promise<void> {
  await sql`DELETE FROM login_attempts WHERE email = ${email}`
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
    session: { strategy: 'jwt', maxAge: JWT_MAX_AGE_SECONDS },
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

          if (await isLockedOut(email)) {
            audit({ action: 'login.locked_out', actor: email, details: `Account locked for ${LOCKOUT_MS / 60000} minutes` })
            throw new Error('TooManyAttempts')
          }

          const [user] = await sql`
            SELECT id, email, password_hash, name, role, must_change_password FROM users WHERE email = ${email}
          `
          if (!user) {
            await bcrypt.compare(credentials.password, DUMMY_HASH)
            await recordFailure(email)
            audit({ action: 'login.failed', actor: email, details: 'Unknown email' })
            return null
          }
          const valid = await bcrypt.compare(credentials.password, user.password_hash)
          if (!valid) {
            await recordFailure(email)
            audit({
              action: 'login.failed',
              actor: email,
              details: 'Invalid password',
            })
            return null
          }
          await clearFailures(email)
          audit({ action: 'login.success', actor: email, details: `Role: ${user.role}` })
          return {
            id: String(user.id),
            email: user.email,
            name: user.name,
            role: normalizeRole(user.role),
            mustChangePassword: Boolean(user.must_change_password),
          }
        },
      }),
    ],
    pages: { signIn: '/login', error: '/login' },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          // Assign a unique jti on first sign-in so we can revoke this token later
          token.jti = randomUUID()
          token.id = user.id
          token.role = normalizeRole('role' in user ? user.role : undefined)
          token.mustChangePassword = 'mustChangePassword' in user ? Boolean(user.mustChangePassword) : false
          token.expiresAt = Math.floor(Date.now() / 1000) + JWT_MAX_AGE_SECONDS
        }
        // Always refresh lastActive so inactivity can be tracked server-side
        token.lastActive = Math.floor(Date.now() / 1000)
        return token
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string
          session.user.role = normalizeRole(token.role)
          ;(session.user as Record<string, unknown>).mustChangePassword = token.mustChangePassword ?? false
          ;(session.user as Record<string, unknown>).jti = token.jti
        }
        return session
      },
    },
    events: {
      async signOut(message) {
        // Revoke the JWT so it cannot be reused before its natural expiry
        const token = 'token' in message ? message.token : undefined
        const jti = (token as Record<string, unknown>)?.jti as string | undefined
        const expiresAt = (token as Record<string, unknown>)?.expiresAt as number | undefined
        const email = (token as Record<string, unknown>)?.email as string | undefined

        if (jti && expiresAt) {
          try {
            await revokeToken(jti, new Date(expiresAt * 1000))
          } catch {
            // Non-fatal — token will expire naturally
          }
        }
        if (email) {
          logger.info('auth.signout', { actor: email })
        }
      },
    },
  }
}
