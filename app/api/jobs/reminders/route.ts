import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Dispatcher } from '@/lib/assistant/dispatcher'

export const dynamic = 'force-dynamic'

export async function POST() {
  const dispatcher = new Dispatcher()
  const now = new Date()
  const due = await prisma.reminder.findMany({
    where: {
      when: { lte: now },
      status: 'PENDING'
    },
    orderBy: { when: 'asc' }
  })
  let sent = 0
  for (const r of due) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: r.userId },
        select: { phone: true }
      })
      const phone = (user?.phone || '').replace(/\D/g, '')
      if (phone) {
        await dispatcher.sendText(phone, `Lembrete: ${r.text}`)
      }
    } catch {}
    await prisma.reminder.update({
      where: { id: r.id },
      data: { status: 'SENT' }
    })
    sent++
    const lower = String(r.text).toLowerCase()
    let next: Date | null = null
    const when: Date = new Date(r.when)
    if (lower.includes('todo dia')) {
      next = new Date(when.getFullYear(), when.getMonth(), when.getDate() + 1, when.getHours(), when.getMinutes())
    } else if (lower.includes('semanal')) {
      next = new Date(when.getFullYear(), when.getMonth(), when.getDate() + 7, when.getHours(), when.getMinutes())
    } else if (lower.includes('mensal')) {
      next = new Date(when.getFullYear(), when.getMonth() + 1, when.getDate(), when.getHours(), when.getMinutes())
    }
    if (next) {
      await prisma.reminder.create({
        data: {
          userId: r.userId,
          text: r.text,
          when: next,
          status: 'PENDING'
        }
      })
    }
  }
  return NextResponse.json({ ok: true, sent })
}