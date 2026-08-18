import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

// Evidence files are stored on local disk (NOT in Postgres as base64).
// The base dir is mounted as a Docker volume (./data/evidencias:/app/data/evidencias).
// Only a RELATIVE path is persisted in the DB; the API always serves the file
// as a base64 data URL so the on-disk path is never exposed to the client.
const EVIDENCIAS_DIR = process.env.EVIDENCIAS_DIR ?? path.join(process.cwd(), 'data', 'evidencias')

export function isDataUrl(value: string): boolean {
  return value.startsWith('data:')
}

function mimeFromFileName(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  switch (ext) {
    case '.pdf': return 'application/pdf'
    case '.png': return 'image/png'
    case '.gif': return 'image/gif'
    case '.webp': return 'image/webp'
    case '.jpeg':
    case '.jpg':
    default: return 'image/jpeg'
  }
}

/**
 * Stores a base64 data URL to disk under <dayNoteId>/<uuid>-<sanitizedName>.
 * Returns the RELATIVE path (e.g. "cm.../uuid-img.png") to persist in the DB.
 */
export async function saveDataUrlToDisk(dayNoteId: string, fileName: string, dataUrl: string): Promise<string> {
  const [meta, b64] = dataUrl.split(',')
  const mime = meta.match(/:(.*?);/)?.[1] ?? mimeFromFileName(fileName)
  const buffer = Buffer.from(b64, 'base64')
  const ext = mime === 'application/pdf' ? '.pdf'
    : mime === 'image/png' ? '.png'
    : mime === 'image/gif' ? '.gif'
    : mime === 'image/webp' ? '.webp'
    : '.jpg'
  const sanitized = (fileName || 'archivo').replace(/[^a-zA-Z0-9.\-_]/g, '_').replace(/\.(pdf|png|gif|webp|jpe?g)$/i, '')
  const relPath = path.posix.join(dayNoteId, `${randomUUID()}-${sanitized}${ext}`)
  const absPath = path.join(EVIDENCIAS_DIR, relPath)
  await fs.mkdir(path.dirname(absPath), { recursive: true })
  await fs.writeFile(absPath, buffer)
  return relPath
}

/**
 * Reads a file (relative path) from disk and returns it as a base64 data URL.
 * Returns an empty string if the file is missing.
 */
export async function readFileAsDataUrl(relPath: string): Promise<string> {
  const absPath = path.join(EVIDENCIAS_DIR, relPath)
  try {
    const buffer = await fs.readFile(absPath)
    const mime = mimeFromFileName(relPath)
    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch {
    return ''
  }
}

/**
 * Deletes the physical file if it exists. Safe to call when the file is not
 * stored on disk (e.g. legacy data URLs kept in the DB).
 */
export async function deleteFileFromDisk(relPath: string): Promise<void> {
  if (isDataUrl(relPath)) return
  const absPath = path.join(EVIDENCIAS_DIR, relPath)
  try {
    await fs.unlink(absPath)
  } catch {
    // ignore — nothing to remove
  }
}
