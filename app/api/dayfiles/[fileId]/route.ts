import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params
  await prisma.dayNoteFile.delete({ where: { id: fileId } })
  return new Response(null, { status: 204 })
}
