import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sql from '@/lib/db'
import type { PoamStatus } from '@/lib/types'

const VALID_STATUSES: PoamStatus[] = ['Open', 'In Progress', 'Closed']

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json()
  const { finding, practice_id, responsible_individual, resources_required, scheduled_completion, milestone_progress, status } = body

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  if (milestone_progress !== undefined && (milestone_progress < 0 || milestone_progress > 100)) {
    return NextResponse.json({ error: 'milestone_progress must be 0–100' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if ('finding' in body) updates.finding = finding
  if ('practice_id' in body) updates.practice_id = practice_id
  if ('responsible_individual' in body) updates.responsible_individual = responsible_individual
  if ('resources_required' in body) updates.resources_required = resources_required
  if ('scheduled_completion' in body) updates.scheduled_completion = scheduled_completion
  if ('milestone_progress' in body) updates.milestone_progress = milestone_progress
  if ('status' in body) updates.status = status

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const [updated] = await sql`
    UPDATE poam_items
    SET ${sql(updates)}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const [deleted] = await sql`DELETE FROM poam_items WHERE id = ${id} RETURNING id`
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ deleted: true })
}
