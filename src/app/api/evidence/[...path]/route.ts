import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/get-session'
import { mimeTypeForPath, resolveEvidencePath } from '@/lib/evidence'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const relPath = params.path.join('/')
  const abs = resolveEvidencePath(relPath)
  if (!abs) return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  if (!existsSync(abs)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data = await readFile(abs)
  const mimeType = mimeTypeForPath(abs)

  return new NextResponse(data, {
    headers: { 'Content-Type': mimeType },
  })
}
