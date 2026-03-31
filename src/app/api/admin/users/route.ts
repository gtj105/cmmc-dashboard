import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import { requireRole } from '@/lib/auth'
import { checkCsrf } from '@/lib/api-csrf'
import sql from '@/lib/db'
import bcrypt from 'bcryptjs'
import { audit, getClientIp } from '@/lib/audit'
import { parseUserCreate, validationError } from '@/lib/validation'

export async function POST(req: NextRequest) {
  const csrfError = checkCsrf(req)
  if (csrfError) return csrfError

  const session = await getAuthSession()
  const authError = requireRole(session, 'admin')
  if (authError) return authError

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = parseUserCreate(rawBody)
  if (!parsed.success) return validationError(parsed.error)
  const { email, name, password, role } = parsed.data

  const passwordHash = await bcrypt.hash(password, 10)

  try {
    const [created] = await sql<{ id: number; email: string; name: string; role: string; must_change_password: boolean; created_at: string }[]>`
      INSERT INTO users (email, password_hash, name, role, must_change_password)
      VALUES (${email.trim()}, ${passwordHash}, ${name.trim()}, ${role}, true)
      RETURNING id, email, name, role, must_change_password, created_at
    `
    await audit({ action: 'user.created', actor: session!.user.email ?? 'admin', target: email, ip: getClientIp(req.headers), details: `Role: ${role}` })
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    const pg = err as { code?: string }
    if (pg.code === '23505') {
      return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
