import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import { requireRole } from '@/lib/auth'
import { checkCsrf } from '@/lib/api-csrf'
import sql from '@/lib/db'
import { deleteEvidenceFile } from '@/lib/evidence'
import { audit, getClientIp } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; eid: string } },
) {
  const csrfError = checkCsrf(_req)
  if (csrfError) return csrfError

  const session = await getAuthSession()
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

  await audit({ action: 'evidence.deleted', actor: session!.user.email ?? 'editor', target: params.id, ip: getClientIp(_req.headers) })
  return new NextResponse(null, { status: 204 })
}
