import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const body = await request.json()
  const dayNote = await prisma.dayNote.upsert({
    where: { taskId_date: { taskId: body.taskId, date: body.date } },
    update: { title: body.title ?? '', text: body.text ?? '' },
    create: { taskId: body.taskId, date: body.date, title: body.title ?? '', text: body.text ?? '', author: 'Admin' },
    include: { files: { orderBy: { createdAt: 'asc' } } },
  })
  return NextResponse.json(dayNote, { status: 201 })
}
