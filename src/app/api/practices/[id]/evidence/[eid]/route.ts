import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions, requireRole } from '@/lib/auth'
import sql from '@/lib/db'
import { deleteEvidenceFile } from '@/lib/evidence'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; eid: string } },
) {
  const session = await getServerSession(getAuthOptions())
  const authError = requireRole(session, 'editor')
  if (authError) return authError

  const evidenceId = parseInt(params.eid, 10)
  if (isNaN(evidenceId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const [item] = await sql`
    DELETE FROM practice_evidence
    WHERE id = ${evidenceId} AND practice_id = ${params.id}
    RETURNING file_path
  `
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (item.file_path) await deleteEvidenceFile(item.file_path as string)

  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count
    FROM practice_evidence
    WHERE practice_id = ${params.id}
  `
  if (count === 0) {
    await sql`
      UPDATE practices SET evidence_exists = false WHERE practice_id = ${params.id}
    `
  }

  return new NextResponse(null, { status: 204 })
}
