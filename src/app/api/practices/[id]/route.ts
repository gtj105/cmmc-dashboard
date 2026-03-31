import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import { requireRole } from '@/lib/auth'
import { checkCsrf } from '@/lib/api-csrf'
import sql from '@/lib/db'
import { parsePracticePatch, validationError } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrfError = checkCsrf(req)
  if (csrfError) return csrfError
  const session = await getAuthSession()
  const authError = requireRole(session, 'editor')
  if (authError) return authError
  const actor = session!.user

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = parsePracticePatch(rawBody)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const updates: Record<string, unknown> = {}
  const body = rawBody as Record<string, unknown>
  if ('status' in body)          updates.status          = data.status
  if ('risk_level' in body)      updates.risk_level      = data.risk_level
  if ('evidence_exists' in body) updates.evidence_exists = data.evidence_exists
  if ('owner' in body)           updates.owner           = data.owner
  if ('due_date' in body)        updates.due_date        = data.due_date
  if ('notes' in body)           updates.notes           = data.notes

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  let result: Record<string, unknown> | null = null

  await sql.begin(async (tx) => {
    const q = tx as unknown as typeof sql
    const [before] = await q`SELECT * FROM practices WHERE id = ${id} FOR UPDATE`
    if (!before) return

    const [updated] = await q`
      UPDATE practices
      SET ${q(updates)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    if (!updated) return

    const changedBy = actor.email ?? actor.name ?? 'unknown'
    for (const [field, newVal] of Object.entries(updates)) {
      const oldVal = (before as Record<string, unknown>)[field]
      if ((oldVal ?? '') !== (newVal ?? '')) {
        await q`
          INSERT INTO practice_history (practice_id, field_changed, old_value, new_value, changed_by)
          VALUES (${before.practice_id}, ${field}, ${oldVal != null ? String(oldVal) : null}, ${newVal != null ? String(newVal) : null}, ${changedBy})
        `
      }
    }

    result = updated as Record<string, unknown>
  })

  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(result)
}
