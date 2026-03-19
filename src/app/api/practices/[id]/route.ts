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
  const { status, evidence_exists, owner, due_date, notes } = body

  // Validate enum fields
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Build updates conditionally - only set fields that are provided in body
  // For text fields, allow explicit null (to clear them)
  const updates: Record<string, unknown> = {}
  if ('status' in body) updates.status = status
  if ('evidence_exists' in body) updates.evidence_exists = evidence_exists
  if ('owner' in body) updates.owner = owner
  if ('due_date' in body) updates.due_date = due_date
  if ('notes' in body) updates.notes = notes

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const [updated] = await sql`
    UPDATE practices
    SET ${sql(updates)}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}
