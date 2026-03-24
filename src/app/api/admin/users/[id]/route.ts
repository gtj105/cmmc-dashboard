import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions, requireRole } from '@/lib/auth'
import { checkCsrf } from '@/lib/api-csrf'
import sql from '@/lib/db'
import { USER_ROLE_VALUES } from '@/lib/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrfError = checkCsrf(req)
  if (csrfError) return csrfError

  const session = await getServerSession(getAuthOptions())
  const authError = requireRole(session, 'admin')
  if (authError) return authError

  const id = parseInt(params.id, 10)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { role } = body as { role?: unknown }
  if (typeof role !== 'string' || !USER_ROLE_VALUES.includes(role as typeof USER_ROLE_VALUES[number])) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // Prevent self-role-change — session.user.id is stored as a string (JWT token)
  const currentId = (session!.user as { id?: string }).id
  if (typeof currentId !== 'string') {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  if (parseInt(currentId, 10) === id) {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 403 })
  }

  try {
    const [updated] = await sql<{ id: number; email: string; name: string; role: string; created_at: string }[]>`
      UPDATE users
      SET role = ${role}
      WHERE id = ${id}
      RETURNING id, email, name, role, created_at
    `
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrfError = checkCsrf(_req)
  if (csrfError) return csrfError

  const session = await getServerSession(getAuthOptions())
  const authError = requireRole(session, 'admin')
  if (authError) return authError

  const id = parseInt(params.id, 10)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
  }

  // Prevent self-deletion
  const currentId = (session!.user as { id?: string }).id
  if (typeof currentId === 'string' && parseInt(currentId, 10) === id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 403 })
  }

  try {
    const [deleted] = await sql<{ id: number }[]>`
      DELETE FROM users WHERE id = ${id} RETURNING id
    `
    if (!deleted) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
