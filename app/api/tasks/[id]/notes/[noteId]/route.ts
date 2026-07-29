import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params
  await prisma.note.delete({ where: { id: noteId } })
  return new Response(null, { status: 204 })
}
