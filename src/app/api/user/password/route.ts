import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { checkCsrf } from '@/lib/api-csrf'
import sql from '@/lib/db'
import bcrypt from 'bcryptjs'
import { audit, getClientIp } from '@/lib/audit'
import { parsePasswordChange, validationError } from '@/lib/validation'

export async function POST(req: NextRequest) {
  const csrfError = checkCsrf(req)
  if (csrfError) return csrfError

  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt((session.user as { id?: string }).id ?? '0', 10)
  if (!userId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = parsePasswordChange(rawBody)
  if (!parsed.success) return validationError(parsed.error)
  const { currentPassword, newPassword } = parsed.data

  const [user] = await sql<{ password_hash: string }[]>`
    SELECT password_hash FROM users WHERE id = ${userId}
  `
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const valid = await bcrypt.compare(currentPassword, user.password_hash)
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })

  const newHash = await bcrypt.hash(newPassword, 10)
  // Also clear must_change_password in case this is a first-login reset
  await sql`UPDATE users SET password_hash = ${newHash}, must_change_password = false WHERE id = ${userId}`

  await audit({ action: 'user.password_changed', actor: session!.user.email ?? 'unknown', ip: getClientIp(req.headers) })
  return new NextResponse(null, { status: 204 })
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
