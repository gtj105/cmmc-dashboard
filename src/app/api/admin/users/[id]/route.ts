import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import { requireRole } from '@/lib/auth'
import { checkCsrf } from '@/lib/api-csrf'
import sql from '@/lib/db'
import { audit, getClientIp } from '@/lib/audit'
import { parseUserRolePatch, validationError } from '@/lib/validation'
import { invalidateUser } from '@/lib/token-revocation'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrfError = checkCsrf(req)
  if (csrfError) return csrfError

  const session = await getAuthSession()
  const authError = requireRole(session, 'admin')
  if (authError) return authError

  const id = parseInt(params.id, 10)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
  }

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = parseUserRolePatch(rawBody)
  if (!parsed.success) return validationError(parsed.error)
  const { role } = parsed.data

  // Prevent self-role-change
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
    await audit({ action: 'user.role_changed', actor: session!.user.email ?? 'admin', target: updated.email, ip: getClientIp(req.headers), details: `Role changed to ${role}` })
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

  const session = await getAuthSession()
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
    const [user] = await sql<{ id: number; email: string }[]>`
      SELECT id, email FROM users WHERE id = ${id}
    `
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    // Invalidate all tokens for this user before deleting the row
    await invalidateUser(id)
    const [deleted] = await sql<{ id: number }[]>`
      DELETE FROM users WHERE id = ${id} RETURNING id
    `
    if (!deleted) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    await audit({ action: 'user.deleted', actor: session!.user.email ?? 'admin', target: user.email, ip: getClientIp(_req.headers) })
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
