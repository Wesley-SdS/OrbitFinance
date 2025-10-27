import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidateTag } from 'next/cache'
import { userTag } from '@/lib/cache-tags'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })
  const reminders = await prisma.reminder.findMany({
    where: { userId: session.user.id },
    orderBy: { when: 'asc' }
  })
  return NextResponse.json({ ok: true, reminders })
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })
  const body = await request.json().catch(() => ({}))
  const text = String(body.text || '').trim()
  const whenStr = body.when ? String(body.when) : ''
  if (!text || !whenStr) return NextResponse.json({ ok: false, message: 'Texto e data/hora obrigatórios' }, { status: 400 })
  const when = new Date(whenStr)
  await prisma.reminder.create({
    data: {
      userId: session.user.id,
      text,
      when,
      status: 'PENDING'
    }
  })
  revalidateTag(userTag(session.user.id, 'reminders'))
  return NextResponse.json({ ok: true })
}