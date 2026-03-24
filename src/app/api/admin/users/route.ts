import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions, requireRole } from '@/lib/auth'
import { checkCsrf } from '@/lib/api-csrf'
import sql from '@/lib/db'
import bcrypt from 'bcryptjs'
import { USER_ROLE_VALUES } from '@/lib/types'

export async function POST(req: NextRequest) {
  const csrfError = checkCsrf(req)
  if (csrfError) return csrfError

  const session = await getServerSession(getAuthOptions())
  const authError = requireRole(session, 'admin')
  if (authError) return authError

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, name, password, role } = body as {
    email?: unknown; name?: unknown; password?: unknown; role?: unknown
  }

  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }
  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (typeof password !== 'string' || password.length < 12) {
    return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 400 })
  }
  if (typeof role !== 'string' || !USER_ROLE_VALUES.includes(role as typeof USER_ROLE_VALUES[number])) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  try {
    const [created] = await sql<{ id: number; email: string; name: string; role: string; created_at: string }[]>`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (${email.trim()}, ${passwordHash}, ${name.trim()}, ${role})
      RETURNING id, email, name, role, created_at
    `
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
