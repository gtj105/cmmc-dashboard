import { createHmac, timingSafeEqual } from 'crypto'

const HMAC_FIELD = '_hmac'
const ALGORITHM = 'sha256'

function getKey(): string {
  const key = process.env.NEXTAUTH_SECRET
  if (!key) throw new Error('NEXTAUTH_SECRET not set — cannot sign backup')
  return key
}

/**
 * Returns an HMAC-SHA256 hex digest of the payload (excluding _hmac itself).
 * Keys are sorted for deterministic serialization.
 */
export function signBackup(payload: Record<string, unknown>): string {
  const { [HMAC_FIELD]: _, ...unsigned } = payload
  const data = JSON.stringify(unsigned, Object.keys(unsigned).sort())
  return createHmac(ALGORITHM, getKey()).update(data).digest('hex')
}

/**
 * Verifies the _hmac field in the payload. Throws if missing or invalid.
 */
export function verifyBackup(payload: unknown): void {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Invalid backup: not an object')
  }
  const obj = payload as Record<string, unknown>
  const providedHmac = obj[HMAC_FIELD]
  if (typeof providedHmac !== 'string' || !providedHmac) {
    throw new Error(
      'Backup file has no integrity signature (_hmac). ' +
      'This file was created before signing was added, or has been tampered with. ' +
      'Re-export a backup from the current application to get a signed file.'
    )
  }
  const expectedHmac = signBackup(obj)
  const provided = Buffer.from(providedHmac, 'hex')
  const expected = Buffer.from(expectedHmac, 'hex')
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new Error('Backup integrity check failed: signature does not match. The file may have been tampered with.')
  }
}
