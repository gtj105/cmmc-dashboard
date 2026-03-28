import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import sql from '@/lib/db'
import { fetchOverlayMappingsForPack, fetchOverlayPackByKey } from '@/lib/overlays'
import { OVERLAY_PACK_KEYS, type OverlayPackKey } from '@/lib/types'

export const dynamic = 'force-dynamic'

function parseOverlayPackKey(value: string): OverlayPackKey | null {
  return (OVERLAY_PACK_KEYS as readonly string[]).includes(value) ? (value as OverlayPackKey) : null
}

export async function GET(
  _req: Request,
  { params }: { params: { key: string } },
) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = parseOverlayPackKey(params.key)
  if (!key) return NextResponse.json({ error: 'Invalid overlay key' }, { status: 400 })

  const pack = await fetchOverlayPackByKey(sql, key)
  if (!pack) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const mappings = await fetchOverlayMappingsForPack(sql, key)
  return NextResponse.json({ pack, mappings })
}
