import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase, EVIDENCE_BUCKET } from '@/lib/supabase'

const SIGNED_URL_TTL = 60 * 60 // 1 hour

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dayNote = await prisma.dayNote.findUnique({
    where: { id },
    include: { files: { orderBy: { createdAt: 'asc' } } },
  })
  if (!dayNote) return new Response(null, { status: 404 })

  const files = await Promise.all(
    dayNote.files.map(async f => {
      if (f.fileUrl.startsWith('data:')) return f // not yet migrated to storage
      const { data } = await supabase.storage.from(EVIDENCE_BUCKET).createSignedUrl(f.fileUrl, SIGNED_URL_TTL)
      return { ...f, fileUrl: data?.signedUrl ?? '' }
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
  const paths = dayNote.files.map(f => f.fileUrl).filter(url => !url.startsWith('data:'))
  if (paths.length > 0) {
    await supabase.storage.from(EVIDENCE_BUCKET).remove(paths)
  }
  return new Response(null, { status: 204 })
}
