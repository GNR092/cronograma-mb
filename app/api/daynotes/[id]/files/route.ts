import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/daynotes/[id]/files  — add one or more files
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const files: { fileUrl: string; fileType: string; fileName: string }[] = body.files ?? [body]
  const created = await prisma.$transaction(
    files.map(f =>
      prisma.dayNoteFile.create({
        data: { dayNoteId: id, fileUrl: f.fileUrl, fileType: f.fileType ?? 'image', fileName: f.fileName ?? '' },
      })
    )
  )
  return NextResponse.json(created, { status: 201 })
}
