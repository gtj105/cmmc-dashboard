import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import { requireRole } from '@/lib/auth'
import { checkCsrf } from '@/lib/api-csrf'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrfError = checkCsrf(req)
  if (csrfError) return csrfError

  const session = await getAuthSession()
  const authError = requireRole(session, 'admin')
  if (authError) return authError

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const [restored] = await sql`
    UPDATE poam_items
    SET deleted_at = NULL
    WHERE id = ${id} AND deleted_at IS NOT NULL
    RETURNING *
  `
  if (!restored) return NextResponse.json({ error: 'Not found or not archived' }, { status: 404 })
  return NextResponse.json(restored)
}
