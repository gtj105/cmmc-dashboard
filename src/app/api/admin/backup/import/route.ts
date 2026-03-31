import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import { requireRole } from '@/lib/auth'
import { checkCsrf } from '@/lib/api-csrf'
import { audit, getClientIp } from '@/lib/audit'
import { validatePayload, restoreFromPayload } from '@/lib/restore'

export async function POST(req: NextRequest) {
  const csrfError = checkCsrf(req)
  if (csrfError) return csrfError

  const session = await getAuthSession()
  const authError = requireRole(session, 'admin')
  if (authError) return authError

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const MAX_BACKUP_BYTES = 10 * 1024 * 1024 // 10 MB
  if (file.size > MAX_BACKUP_BYTES) {
    return NextResponse.json({ error: 'Backup file too large (max 10 MB)' }, { status: 400 })
  }

  let parsed: unknown
  try {
    const text = await file.text()
    parsed = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'File is not valid JSON' }, { status: 400 })
  }

  try {
    validatePayload(parsed)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }

  try {
    await restoreFromPayload(parsed)
  } catch (err) {
    console.error('Import failed:', err)
    return NextResponse.json({ error: 'Import failed. The database was not modified.' }, { status: 500 })
  }

  await audit({ action: 'backup.imported', actor: session!.user.email ?? 'admin', ip: getClientIp(req.headers), details: 'Full data restore' })
  return NextResponse.json({ ok: true, message: 'Restore complete.' })
}
