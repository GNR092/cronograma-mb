import { randomUUID } from 'crypto'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase, EVIDENCE_BUCKET, signFileUrls } from '@/lib/supabase'

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
}

// POST /api/daynotes/[id]/files  — upload one or more files (multipart/form-data, field "files")
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const formData = await req.formData()
  const files = formData.getAll('files').filter((f): f is File => f instanceof File)

  const created = []
  for (const file of files) {
    const fileType = file.type.startsWith('image/') ? 'image' : 'pdf'
    const path = `${id}/${randomUUID()}-${sanitizeName(file.name)}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error } = await supabase.storage.from(EVIDENCE_BUCKET).upload(path, buffer, {
      contentType: file.type || (fileType === 'pdf' ? 'application/pdf' : 'image/jpeg'),
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    created.push(
      await prisma.dayNoteFile.create({
        data: { dayNoteId: id, fileUrl: path, fileType, fileName: file.name },
      })
    )
  }

  const signed = await signFileUrls(created.map(f => f.fileUrl))
  const withSignedUrls = created.map(f => ({ ...f, fileUrl: signed.get(f.fileUrl) ?? '' }))

  return NextResponse.json(withSignedUrls, { status: 201 })
}
