import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { getAuthSession } from '@/lib/get-session'
import { requireRole } from '@/lib/auth'
import sql from '@/lib/db'
import { audit, getClientIp } from '@/lib/audit'
import { signBackup } from '@/lib/backup-hmac'

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  const authError = requireRole(session, 'admin')
  if (authError) return authError

  const [users, domains, practices, poamItems, practiceHistory, overlayPacks, overlayValidations] = await Promise.all([
    sql`SELECT id, email, name, role, must_change_password, created_at FROM users ORDER BY id`,
    sql`SELECT * FROM domains ORDER BY id`,
    sql`SELECT * FROM practices ORDER BY id`,
    sql`SELECT * FROM poam_items ORDER BY id`,
    sql`SELECT * FROM practice_history ORDER BY id`,
    sql`SELECT key, enabled FROM overlay_packs ORDER BY id`,
    sql`SELECT * FROM overlay_validations ORDER BY id`,
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    exported_by: (session!.user as { email?: string }).email ?? 'unknown',
    // password_hash intentionally excluded — users must reset passwords after a restore
    users,
    domains,
    practices,
    poam_items: poamItems,
    practice_history: practiceHistory,
    overlay_pack_states: overlayPacks,
    overlay_validations: overlayValidations,
  }

  const signedPayload = {
    ...payload,
    _hmac: signBackup(payload as Record<string, unknown>),
  }

  const date = new Date().toISOString().slice(0, 10)
  const filename = `cmmc-backup-${date}.json`

  await audit({ action: 'backup.exported', actor: session!.user.email ?? 'admin', ip: getClientIp(req.headers) })
  return new NextResponse(JSON.stringify(signedPayload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
