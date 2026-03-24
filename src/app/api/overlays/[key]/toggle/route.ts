import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { getAuthOptions, requireRole } from '@/lib/auth'
import { checkCsrf } from '@/lib/api-csrf'
import sql from '@/lib/db'
import { fetchOverlayPackByKey, toggleOverlayPackEnabled } from '@/lib/overlays'
import { OVERLAY_PACK_KEYS, type OverlayPackKey } from '@/lib/types'

export const dynamic = 'force-dynamic'

function parseOverlayPackKey(value: string): OverlayPackKey | null {
  return (OVERLAY_PACK_KEYS as readonly string[]).includes(value) ? (value as OverlayPackKey) : null
}

export async function POST(
  req: NextRequest,
  { params }: { params: { key: string } },
) {
  const csrfError = checkCsrf(req)
  if (csrfError) return csrfError

  const session = await getServerSession(getAuthOptions())
  const authError = requireRole(session, 'editor')
  if (authError) return authError

  const key = parseOverlayPackKey(params.key)
  if (!key) return NextResponse.json({ error: 'Invalid overlay key' }, { status: 400 })

  const currentPack = await fetchOverlayPackByKey(sql, key)
  if (!currentPack) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (currentPack.status !== 'available') {
    return NextResponse.json({ error: 'Mapping pack not loaded' }, { status: 409 })
  }

  const body = await req.json().catch(() => ({}))
  const desiredEnabled = typeof body?.enabled === 'boolean' ? body.enabled : !currentPack.enabled
  const updated = await toggleOverlayPackEnabled(sql, key, desiredEnabled)

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  revalidatePath('/overlays')
  revalidatePath('/overview')
  revalidatePath('/risk')
  revalidatePath('/poam')
  for (let domainId = 1; domainId <= 14; domainId += 1) {
    revalidatePath(`/domain/${domainId}`)
  }
  return NextResponse.json(updated)
}
