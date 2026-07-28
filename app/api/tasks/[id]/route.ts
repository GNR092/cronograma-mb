import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/tasks/[id]'>) {
  const { id } = await ctx.params
  const body = await req.json()
  const task = await prisma.task.update({
    where: { id },
    data: {
      name: body.name,
      startDate: body.startDate,
      duration: Number(body.duration),
      notes: body.notes ?? '',
    },
  })
  return NextResponse.json(task)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/tasks/[id]'>) {
  const { id } = await ctx.params
  await prisma.task.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
