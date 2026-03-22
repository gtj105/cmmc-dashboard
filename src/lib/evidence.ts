import { mkdir, unlink, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export const EVIDENCE_ROOT = process.env.EVIDENCE_ROOT ?? '/data/evidence'

export const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.png', '.jpg', '.jpeg', '.gif',
  '.docx', '.xlsx', '.csv', '.txt', '.zip',
])

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'application/zip',
])

const MIME_MAP: Record<string, string> = {
  '.pdf':  'application/pdf',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv':  'text/csv',
  '.txt':  'text/plain',
  '.zip':  'application/zip',
}

const PATH_SEGMENT_RE = /^[a-zA-Z0-9._-]+$/

export function validateFileType(filename: string, mimeType: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  return ALLOWED_EXTENSIONS.has(ext) && ALLOWED_MIME_TYPES.has(mimeType)
}

export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE
}

/** Resolves a relative evidence path to an absolute path, or null if invalid. */
export function resolveEvidencePath(relPath: string): string | null {
  const segments = relPath.split('/')
  if (segments.length === 0 || segments.some((s) => !PATH_SEGMENT_RE.test(s))) return null
  const resolved = path.resolve(EVIDENCE_ROOT, ...segments)
  const prefix = EVIDENCE_ROOT.endsWith(path.sep) ? EVIDENCE_ROOT : EVIDENCE_ROOT + path.sep
  if (!resolved.startsWith(prefix)) return null
  return resolved
}

/** Generates a relative path for a new evidence file without writing it. */
export function buildEvidencePath(practiceId: string, filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const safeId = practiceId.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${safeId}/${randomUUID()}${ext}`
}

/** Writes a buffer to the given relative evidence path. Creates directories as needed. */
export async function writeEvidenceFileAt(relPath: string, buffer: Buffer): Promise<void> {
  const segments = relPath.split('/')
  const dir = path.join(EVIDENCE_ROOT, segments[0])
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(EVIDENCE_ROOT, ...segments), buffer)
}

/** Writes an uploaded file to disk. Returns the relative path stored in DB. */
export async function writeEvidenceFile(
  practiceId: string,
  filename: string,
  buffer: Buffer,
): Promise<string> {
  const ext = path.extname(filename).toLowerCase()
  const safeId = practiceId.replace(/[^a-zA-Z0-9._-]/g, '_')
  await mkdir(path.join(EVIDENCE_ROOT, safeId), { recursive: true })
  const uuid = randomUUID()
  const relPath = `${safeId}/${uuid}${ext}`
  await writeFile(path.join(EVIDENCE_ROOT, safeId, `${uuid}${ext}`), buffer)
  return relPath
}

/** Deletes a stored evidence file. Silently ignores missing files. */
export async function deleteEvidenceFile(relPath: string): Promise<void> {
  const abs = resolveEvidencePath(relPath)
  if (!abs) return
  try {
    await unlink(abs)
  } catch {
    // already gone — not an error
  }
}

/** Returns the MIME type for a file extension. */
export function mimeTypeForPath(filePath: string): string {
  return MIME_MAP[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}
