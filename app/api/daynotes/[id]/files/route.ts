import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isDataUrl, readFileAsDataUrl, saveDataUrlToDisk } from '@/lib/evidencias'

// POST /api/daynotes/[id]/files  — add one or more files
// The client sends base64 data URLs; each is written to disk and the DB stores
// only the relative path. The RESPONSE always returns the file as a base64 data
// URL (never the on-disk path) so the client never sees where the file lives.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const files: { fileUrl: string; fileType: string; fileName: string }[] = body.files ?? [body]
  const created = await prisma.$transaction(async tx => {
    const out = []
    for (const f of files) {
      const storedUrl = isDataUrl(f.fileUrl)
        ? await saveDataUrlToDisk(id, f.fileName, f.fileUrl)
        : f.fileUrl
      out.push(await tx.dayNoteFile.create({
        data: { dayNoteId: id, fileUrl: storedUrl, fileType: f.fileType ?? 'image', fileName: f.fileName ?? '' },
      }))
    }
    return out
  })
  // Convert on-disk paths back to data URLs before responding
  const response = await Promise.all(created.map(async file => {
    if (isDataUrl(file.fileUrl)) return file
    const dataUrl = await readFileAsDataUrl(file.fileUrl)
    return { ...file, fileUrl: dataUrl || file.fileUrl }
  }))
  return NextResponse.json(response, { status: 201 })
}