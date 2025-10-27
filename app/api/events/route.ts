import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidateTag } from 'next/cache'
import { userTag } from '@/lib/cache-tags'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })
  const { searchParams } = new URL(request.url)
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')
  const from = fromStr ? new Date(fromStr) : new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
  const to = toStr ? new Date(toStr) : new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7)
  const events = await prisma.event.findMany({
    where: {
      userId: session.user.id,
      startAt: { gte: from, lt: to }
    },
    orderBy: { startAt: 'asc' }
  })
  return NextResponse.json({ ok: true, events })
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })
  const body = await request.json().catch(() => ({}))
  const title = String(body.title || '').trim()
  const startAtStr = body.startAt ? String(body.startAt) : ''
  if (!title || !startAtStr) return NextResponse.json({ ok: false, message: 'Título e início obrigatórios' }, { status: 400 })
  const startAt = new Date(startAtStr)
  const endAt = body.endAt ? new Date(String(body.endAt)) : null
  await prisma.event.create({
    data: {
      userId: session.user.id,
      title,
      startAt,
      endAt
    }
  })
  revalidateTag(userTag(session.user.id, 'events'))
  return NextResponse.json({ ok: true })
}