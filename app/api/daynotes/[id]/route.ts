import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dayNote = await prisma.dayNote.findUnique({
    where: { id },
    include: { files: { orderBy: { createdAt: 'asc' } } },
  })
  if (!dayNote) return new Response(null, { status: 404 })
  return NextResponse.json(dayNote)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.dayNote.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
