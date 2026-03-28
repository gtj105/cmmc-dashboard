// src/lib/get-session.ts
//
// Drop-in replacement for getServerSession(getAuthOptions()) that also
// enforces token revocation. Use this in ALL API routes.

import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { isTokenRevoked, isUserInvalidated } from '@/lib/token-revocation'

/**
 * Returns the session if the request is authenticated and the token is not revoked.
 * Returns null if: not authenticated, token revoked at logout, or user was invalidated.
 */
export async function getAuthSession(): Promise<Session | null> {
  const session = await getServerSession(getAuthOptions())
  if (!session) return null

  const jti = (session.user as Record<string, unknown>)?.jti as string | undefined
  const userId = (session.user as Record<string, unknown>)?.id as string | undefined
  const iat = ((session as unknown) as Record<string, unknown>).iat as number | undefined

  // Check per-token revocation (logout)
  if (jti && (await isTokenRevoked(jti))) return null

  // Check per-user invalidation (user deleted)
  if (userId && iat && (await isUserInvalidated(parseInt(userId, 10), iat))) return null

  return session
}
