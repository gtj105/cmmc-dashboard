import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sql from '@/lib/db'
import type { Status, RiskLevel } from '@/lib/types'

const VALID_STATUSES: Status[] = ['Not Started', 'In Progress', 'Implemented', 'Audit Ready']
const VALID_RISKS: RiskLevel[] = ['Low', 'Medium', 'High', 'Critical']

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json()
  const { status, risk_level, evidence_exists, owner, due_date, notes } = body

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  if (risk_level !== undefined && !VALID_RISKS.includes(risk_level)) {
    return NextResponse.json({ error: 'Invalid risk_level' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if ('status' in body) updates.status = status
  if ('risk_level' in body) updates.risk_level = risk_level
  if ('evidence_exists' in body) updates.evidence_exists = evidence_exists
  if ('owner' in body) updates.owner = owner
  if ('due_date' in body) updates.due_date = due_date
  if ('notes' in body) updates.notes = notes

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // Fetch current values before updating (to capture old values for history)
  const [before] = await sql`SELECT * FROM practices WHERE id = ${id}`
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [updated] = await sql`
    UPDATE practices
    SET ${sql(updates)}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `

  // Write history entries for each changed field
  const changedBy = session.user?.email ?? session.user?.name ?? 'unknown'
  for (const [field, newVal] of Object.entries(updates)) {
    const oldVal = (before as Record<string, unknown>)[field]
    if (String(oldVal) !== String(newVal)) {
      await sql`
        INSERT INTO practice_history (practice_id, field_changed, old_value, new_value, changed_by)
        VALUES (${before.practice_id}, ${field}, ${oldVal != null ? String(oldVal) : null}, ${newVal != null ? String(newVal) : null}, ${changedBy})
      `
    }
  }

  return NextResponse.json(updated)
}
