import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions, requireRole } from '@/lib/auth'
import { checkCsrf } from '@/lib/api-csrf'
import sql from '@/lib/db'
import { parsePoamPatch, validationError } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrfError = checkCsrf(req)
  if (csrfError) return csrfError

  const session = await getServerSession(getAuthOptions())
  const authError = requireRole(session, 'editor')
  if (authError) return authError

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = parsePoamPatch(rawBody)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const updates: Record<string, unknown> = {}
  const body = rawBody as Record<string, unknown>
  if ('finding' in body)               updates.finding               = data.finding
  if ('practice_id' in body)           updates.practice_id           = data.practice_id
  if ('responsible_individual' in body) updates.responsible_individual = data.responsible_individual
  if ('resources_required' in body)    updates.resources_required    = data.resources_required
  if ('scheduled_completion' in body)  updates.scheduled_completion  = data.scheduled_completion
  if ('milestone_progress' in body)    updates.milestone_progress    = data.milestone_progress
  if ('status' in body)                updates.status                = data.status

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  let updated: Record<string, unknown> | undefined
  try {
    const [result] = await sql`
      UPDATE poam_items
      SET ${sql(updates)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    updated = result
  } catch (err: unknown) {
    const pgErr = err as { code?: string }
    if (pgErr?.code === '23503') {
      return NextResponse.json({ error: 'Invalid practice_id — practice not found' }, { status: 400 })
    }
    throw err
  }
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
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

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const [deleted] = await sql`DELETE FROM poam_items WHERE id = ${id} RETURNING id`
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ deleted: true })
}
