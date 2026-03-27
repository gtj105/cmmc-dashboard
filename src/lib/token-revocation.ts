/**
 * token-revocation.ts
 *
 * Tracks revoked JWT tokens in the database so that deleted or logged-out users
 * cannot reuse tokens that haven't naturally expired yet.
 *
 * Each JWT carries a `jti` (JWT ID) claim — a random UUID generated at sign-in.
 * On logout or user deletion we insert that jti into revoked_tokens.
 * On each request, middleware checks the jti against this table.
 *
 * Expired tokens are auto-purged on reads to keep the table small.
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
  // Purge expired rows opportunistically (cheap — only runs when this fn is called)
  await sql`DELETE FROM revoked_tokens WHERE expires_at < NOW()`

  const [row] = await sql`SELECT 1 FROM revoked_tokens WHERE jti = ${jti}`
  return !!row
}

/** Revoke all tokens for a user by their numeric id. Used when deleting a user. */
export async function revokeAllTokensForUser(_userId: number): Promise<void> {
  // We don't store user → jti mapping (that would require a session table).
  // Instead, we rely on the JWT maxAge being short (24h default).
  // This function is a no-op placeholder — implement if you add a sessions table.
}
