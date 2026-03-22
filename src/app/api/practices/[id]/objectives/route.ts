import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await sql<{ objective_letter: string; status: string }[]>`
    SELECT objective_letter, status
    FROM practice_objective_status
    WHERE practice_id = ${params.id}
  `

  const result: Record<string, string> = {}
  for (const row of rows) {
    result[row.objective_letter] = row.status
  }
  return NextResponse.json(result)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { letter, status } = await req.json()
  const validStatuses = ['met', 'partial', 'not_met', 'not_assessed']
  if (!letter || !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  await sql`
    INSERT INTO practice_objective_status (practice_id, objective_letter, status, updated_at)
    VALUES (${params.id}, ${letter}, ${status}, now())
    ON CONFLICT (practice_id, objective_letter)
    DO UPDATE SET status = ${status}, updated_at = now()
  `

  return NextResponse.json({ ok: true })
}
