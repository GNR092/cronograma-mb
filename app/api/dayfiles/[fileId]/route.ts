import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteFileFromDisk, isDataUrl, readFileAsDataUrl } from '@/lib/evidencias'

// GET /api/dayfiles/[fileId] — returns the file as a base64 data URL without
// exposing the on-disk path. Legacy files (already data URLs) are echoed.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params
  const file = await prisma.dayNoteFile.findUnique({ where: { id: fileId } })
  if (!file) return new Response(null, { status: 404 })

  const fileUrl = isDataUrl(file.fileUrl)
    ? file.fileUrl
    : (await readFileAsDataUrl(file.fileUrl)) || file.fileUrl

  return NextResponse.json({ ...file, fileUrl })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params
  const file = await prisma.dayNoteFile.findUnique({ where: { id: fileId } })
  if (!file) return new Response(null, { status: 404 })
  await prisma.dayNoteFile.delete({ where: { id: fileId } })
  if (!isDataUrl(file.fileUrl)) {
    await deleteFileFromDisk(file.fileUrl)
  }
  return new Response(null, { status: 204 })
}