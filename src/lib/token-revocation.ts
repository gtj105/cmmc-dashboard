/**
 * token-revocation.ts
 *
 * Two revocation mechanisms:
 *
 * 1. Per-token revocation (jti-based): used on logout.
 *    Inserts the token's jti into revoked_tokens.
 *
 * 2. Per-user revocation (user_id-based): used on user deletion.
 *    Inserts a row into user_invalidations with the current timestamp.
 *    Any token issued BEFORE that timestamp is treated as revoked.
 *    The user row may no longer exist — user_invalidations is separate.
 */

import sql from '@/lib/db'

/** Insert a jti into the revoked_tokens table. expiresAt = when the JWT would have expired. */
export async function revokeToken(jti: string, expiresAt: Date): Promise<void> {
  await sql`
    INSERT INTO revoked_tokens (jti, expires_at)
    VALUES (${jti}, ${expiresAt.toISOString()})
    ON CONFLICT (jti) DO NOTHING
  `
}

/** Returns true if the jti is in the revoked_tokens table (and not yet expired). */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  const [row] = await sql`SELECT 1 FROM revoked_tokens WHERE jti = ${jti} AND expires_at > NOW()`
  return !!row
}

/** Remove expired tokens from the revoked_tokens table. Call this from a background job or on logout. */
export async function pruneExpiredTokens(): Promise<void> {
  await sql`DELETE FROM revoked_tokens WHERE expires_at < NOW()`
}

/**
 * Revoke all tokens for a user by recording the current time.
 * Any JWT with iat < invalidated_at is treated as revoked.
 * Call this when deleting a user.
 */
export async function invalidateUser(userId: number): Promise<void> {
  await sql`
    INSERT INTO user_invalidations (user_id, invalidated_at)
    VALUES (${userId}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET invalidated_at = NOW()
  `
}

/**
 * Returns true if the user has been invalidated after the given token issue time.
 * iat is the JWT "issued at" timestamp (seconds since epoch).
 */
export async function isUserInvalidated(userId: number, iat: number): Promise<boolean> {
  const issuedAt = new Date(iat * 1000)
  const [row] = await sql`
    SELECT 1 FROM user_invalidations
    WHERE user_id = ${userId} AND invalidated_at > ${issuedAt.toISOString()}
  `
  return !!row
}
