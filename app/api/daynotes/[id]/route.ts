import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isDataUrl, readFileAsDataUrl } from '@/lib/evidencias'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dayNote = await prisma.dayNote.findUnique({
    where: { id },
    include: { files: { orderBy: { createdAt: 'asc' } } },
  })
  if (!dayNote) return new Response(null, { status: 404 })

  // Files stored on disk are read and converted to base64 data URLs so the
  // on-disk path is never exposed. Legacy files (already data URLs) pass through.
  const files = await Promise.all(
    dayNote.files.map(async f => {
      if (isDataUrl(f.fileUrl)) return f
      const dataUrl = await readFileAsDataUrl(f.fileUrl)
      return { ...f, fileUrl: dataUrl || f.fileUrl }
    })
  )

  return NextResponse.json({ ...dayNote, files })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dayNote = await prisma.dayNote.delete({
    where: { id },
    include: { files: true },
  })
  for (const f of dayNote.files) {
    if (!isDataUrl(f.fileUrl)) {
      const { deleteFileFromDisk } = await import('@/lib/evidencias')
      await deleteFileFromDisk(f.fileUrl)
    }
  }
  return new Response(null, { status: 204 })
}