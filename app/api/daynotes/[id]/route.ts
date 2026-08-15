import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase, EVIDENCE_BUCKET, signFileUrls } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dayNote = await prisma.dayNote.findUnique({
    where: { id },
    include: { files: { orderBy: { createdAt: 'asc' } } },
  })
  if (!dayNote) return new Response(null, { status: 404 })

  const paths = dayNote.files.map(f => f.fileUrl).filter(url => !url.startsWith('data:'))
  const signed = await signFileUrls(paths)
  const files = dayNote.files.map(f => f.fileUrl.startsWith('data:') ? f : { ...f, fileUrl: signed.get(f.fileUrl) ?? '' })

  return NextResponse.json({ ...dayNote, files })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dayNote = await prisma.dayNote.delete({
    where: { id },
    include: { files: true },
  })
  const paths = dayNote.files.map(f => f.fileUrl).filter(url => !url.startsWith('data:'))
  if (paths.length > 0) {
    await supabase.storage.from(EVIDENCE_BUCKET).remove(paths)
  }
  return new Response(null, { status: 204 })
}
