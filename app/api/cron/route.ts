import { NextResponse } from 'next/server'
import { Dispatcher } from '@/lib/assistant/dispatcher'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const dispatcher = new Dispatcher()
    const now = new Date()
    const due = await prisma.$queryRaw<any[]>`\
      SELECT id, user_id as "userId", text, "when"\
      FROM reminders\
      WHERE "when" <= ${now} AND status = 'PENDING'\
      ORDER BY "when" ASC\
    `
    let sent = 0
    for (const r of due) {
      try {
        const urows = await prisma.$queryRaw<any[]>`SELECT phone FROM users WHERE id = ${r.userId} LIMIT 1`
        const phone = (urows?.[0]?.phone || '').replace(/\D/g, '')
        if (phone) {
          await dispatcher.sendText(phone, `Lembrete: ${r.text}`)
        }
      } catch {}
      await prisma.$executeRaw`UPDATE reminders SET status = 'SENT' WHERE id = ${r.id}`
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
        const newId = (Math.random().toString(36).slice(2) + Date.now().toString(36))
        await prisma.$executeRaw`INSERT INTO reminders (id, user_id, text, "when", status) VALUES (${newId}, ${r.userId}, ${r.text}, ${next}, 'PENDING')`
      }
    }
    return NextResponse.json({ ok: true, sent })
  } catch (error) {
    console.error("Cron job failed:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}