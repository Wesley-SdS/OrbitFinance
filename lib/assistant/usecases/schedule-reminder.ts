import { PrismaReminderRepo, PrismaUserRepo } from '../../assistant/repositories'
import { parseDateRelative } from '../nlu'

export class ScheduleReminder {
  constructor(private readonly users = new PrismaUserRepo(), private readonly repo = new PrismaReminderRepo()) {}
  async execute(input: { phone: string; text: string }) {
    const { id: userId } = await this.users.getOrCreateByPhone(input.phone)
    const when = parseDateRelative(input.text)
    if (!when) return { ok: false as const, message: 'Não entendi a data/hora. Ex.: lembrar amanhã 9h pagar conta' }
    const text = input.text.replace(/lembrar/i, '').trim()
    await this.repo.create({ userId, text, when })
    return { ok: true as const, message: 'Lembrete agendado.' }
  }
}

