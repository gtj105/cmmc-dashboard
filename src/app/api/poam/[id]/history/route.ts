import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import { requireRole } from '@/lib/auth'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession()
  const authError = requireRole(session, 'viewer')
  if (authError) return authError

  const id = parseInt(params.id)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const rows = await sql`
    SELECT * FROM poam_history
    WHERE poam_id = ${id}
    ORDER BY changed_at DESC
  `
  return NextResponse.json(rows)
}
