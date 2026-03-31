import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import { checkCsrf } from '@/lib/api-csrf'
import sql from '@/lib/db'
import { parseObjectivePatch, validationError } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthSession()
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
  const csrfError = checkCsrf(req)
  if (csrfError) return csrfError

  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = parseObjectivePatch(rawBody)
  if (!parsed.success) return validationError(parsed.error)
  const { letter, status } = parsed.data

  await sql`
    INSERT INTO practice_objective_status (practice_id, objective_letter, status, updated_at)
    VALUES (${params.id}, ${letter}, ${status}, now())
    ON CONFLICT (practice_id, objective_letter)
    DO UPDATE SET status = ${status}, updated_at = now()
  `

  return NextResponse.json({ ok: true })
}
