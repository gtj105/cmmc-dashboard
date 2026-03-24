import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { checkCsrf } from '@/lib/api-csrf'
import sql from '@/lib/db'
import bcrypt from 'bcryptjs'
import { audit, getClientIp } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const csrfError = checkCsrf(req)
  if (csrfError) return csrfError

  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt((session.user as { id?: string }).id ?? '0', 10)
  if (!userId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { currentPassword, newPassword } = body as { currentPassword?: unknown; newPassword?: unknown }

  if (typeof currentPassword !== 'string' || !currentPassword) {
    return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
  }
  if (typeof newPassword !== 'string' || newPassword.length < 12) {
    return NextResponse.json({ error: 'New password must be at least 12 characters' }, { status: 400 })
  }
  if (currentPassword === newPassword) {
    return NextResponse.json({ error: 'New password must be different from current password' }, { status: 400 })
  }

  const [user] = await sql<{ password_hash: string }[]>`
    SELECT password_hash FROM users WHERE id = ${userId}
  `
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const valid = await bcrypt.compare(currentPassword, user.password_hash)
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })

  const newHash = await bcrypt.hash(newPassword, 10)
  await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${userId}`

  await audit({ action: 'user.password_changed', actor: session!.user.email ?? 'unknown', ip: getClientIp(req.headers) })
  return new NextResponse(null, { status: 204 })
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
