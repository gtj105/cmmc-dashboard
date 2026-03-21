import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import sql from '@/lib/db'
import type { UserRole } from '@/lib/types'

const DUMMY_HASH = '$2b$10$dummy.hash.for.timing.protection.placeholder.xxxxx'
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
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET environment variable is required')
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
          const [user] = await sql`
            SELECT id, email, password_hash, name, role FROM users WHERE email = ${credentials.email}
          `
          if (!user) {
            await bcrypt.compare(credentials.password, DUMMY_HASH)
            return null
          }
          const valid = await bcrypt.compare(credentials.password, user.password_hash)
          if (!valid) return null
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
