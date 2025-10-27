import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidateTag } from 'next/cache'
import { userTag } from '@/lib/cache-tags'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })
  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id, status: 'open' },
    orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }]
  })
  return NextResponse.json({ ok: true, tasks })
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })
  const body = await request.json().catch(() => ({}))
  const text = String(body.text || '').trim()
  const dueAtStr = body.dueAt ? String(body.dueAt) : null
  if (!text) return NextResponse.json({ ok: false, message: 'Texto obrigatório' }, { status: 400 })
  const dueAt = dueAtStr ? new Date(dueAtStr) : null
  await prisma.task.create({
    data: {
      userId: session.user.id,
      text,
      dueAt,
      priority: 'medium',
      status: 'open'
    }
  })
  revalidateTag(userTag(session.user.id, 'tasks'))
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })
  const body = await request.json().catch(() => ({}))
  const id = String(body.id || '')
  const action = String(body.action || '')
  if (!id || action !== 'complete') return NextResponse.json({ ok: false }, { status: 400 })
  await prisma.task.updateMany({
    where: { id, userId: session.user.id },
    data: { status: 'done' }
  })
  revalidateTag(userTag(session.user.id, 'tasks'))
  return NextResponse.json({ ok: true })
}