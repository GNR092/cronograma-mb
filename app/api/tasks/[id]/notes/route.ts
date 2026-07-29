import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const note = await prisma.note.create({
    data: {
      taskId: id,
      text: body.text,
      color: body.color ?? 'purple',
      author: body.author,
    },
  })
  return NextResponse.json(note, { status: 201 })
}
