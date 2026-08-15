import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase, EVIDENCE_BUCKET } from '@/lib/supabase'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params
  const file = await prisma.dayNoteFile.delete({ where: { id: fileId } })
  if (!file.fileUrl.startsWith('data:')) {
    await supabase.storage.from(EVIDENCE_BUCKET).remove([file.fileUrl])
  }
  return new Response(null, { status: 204 })
}
