import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions, requireRole } from '@/lib/auth'
import sql from '@/lib/db'
import {
  deleteEvidenceFile,
  MAX_FILE_SIZE,
  validateFileSize,
  validateFileType,
  writeEvidenceFile,
} from '@/lib/evidence'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await sql`
    SELECT id, practice_id, label, file_path, url, uploaded_by, created_at
    FROM practice_evidence
    WHERE practice_id = ${params.id}
    ORDER BY created_at ASC
  `
  return NextResponse.json(items)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(getAuthOptions())
  const authError = requireRole(session, 'editor')
  if (authError) return authError

  const uploadedBy = session!.user?.email
  if (!uploadedBy) return NextResponse.json({ error: 'Session missing email' }, { status: 400 })

  const [practice] = await sql`
    SELECT practice_id FROM practices WHERE practice_id = ${params.id}
  `
  if (!practice) return NextResponse.json({ error: 'Practice not found' }, { status: 400 })

  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const label = (formData.get('label') as string | null)?.trim() ?? ''
    const file = formData.get('file') as File | null

    if (!label) return NextResponse.json({ error: 'label is required' }, { status: 400 })
    if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 })
    if (!validateFileSize(file.size)) {
      return NextResponse.json({ error: 'File exceeds 25 MB limit' }, { status: 400 })
    }
    if (!validateFileType(file.name, file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // DB insert first (spec requirement: no file on disk without a DB record)
    let relPath: string
    let item: Record<string, unknown>
    ;[item] = await sql`
      INSERT INTO practice_evidence (practice_id, label, file_path, uploaded_by)
      VALUES (${params.id}, ${label}, ${'__pending__'}, ${uploadedBy})
      RETURNING *
    `
    try {
      relPath = await writeEvidenceFile(params.id, file.name, buffer)
    } catch {
      await sql`DELETE FROM practice_evidence WHERE id = ${(item as { id: number }).id}`
      return NextResponse.json({ error: 'Failed to write file' }, { status: 500 })
    }
    ;[item] = await sql`
      UPDATE practice_evidence SET file_path = ${relPath} WHERE id = ${(item as { id: number }).id}
      RETURNING *
    `
    await sql`UPDATE practices SET evidence_exists = true WHERE practice_id = ${params.id}`

    return NextResponse.json(item, { status: 201 })
  }

  // JSON — URL submission
  const body = await req.json()
  const label = typeof body.label === 'string' ? body.label.trim() : ''
  const url = typeof body.url === 'string' ? body.url.trim() : ''

  if (!label) return NextResponse.json({ error: 'label is required' }, { status: 400 })
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  const [urlItem] = await sql`
    INSERT INTO practice_evidence (practice_id, label, url, uploaded_by)
    VALUES (${params.id}, ${label}, ${url}, ${uploadedBy})
    RETURNING *
  `
  await sql`UPDATE practices SET evidence_exists = true WHERE practice_id = ${params.id}`
  return NextResponse.json(urlItem, { status: 201 })
}
