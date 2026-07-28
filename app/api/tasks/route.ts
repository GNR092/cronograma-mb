import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const tasks = await prisma.task.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json(tasks)
}

export async function POST(request: Request) {
  const body = await request.json()
  const task = await prisma.task.create({
    data: {
      name: body.name,
      startDate: body.startDate,
      duration: Number(body.duration),
      notes: body.notes ?? '',
    },
  })
  return NextResponse.json(task, { status: 201 })
}
