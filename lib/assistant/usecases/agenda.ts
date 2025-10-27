import { PrismaEventRepo, PrismaUserRepo } from '../../assistant/repositories'
import { extractRange, parseDateRelative } from '../nlu'

export class CreateEvent {
  constructor(private readonly users = new PrismaUserRepo(), private readonly repo = new PrismaEventRepo()) {}
  async execute(input: { phone: string; text: string }) {
    const { id: userId } = await this.users.getOrCreateByPhone(input.phone)
    const when = parseDateRelative(input.text) ?? new Date()
    const title = input.text.replace(/(marcar|agenda)/i, '').trim()
    await this.repo.create({ userId, title: title || 'Compromisso', startAt: when })
    return { ok: true as const, message: 'Compromisso registrado.' }
  }
}

export class AgendaSummary {
  constructor(private readonly users = new PrismaUserRepo(), private readonly repo = new PrismaEventRepo()) {}
  async execute(input: { phone: string; text: string }) {
    const { id: userId } = await this.users.getOrCreateByPhone(input.phone)
    const range = extractRange(input.text) ?? (() => {
      const now = new Date()
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      return { from, to }
    })()
    const items = await this.repo.listByRange(userId, range.from, range.to)
    if (items.length === 0) return { ok: true as const, message: 'Sem compromissos no período.' }
    const lines = items.map((e) => `• ${e.title} — ${e.startAt.toLocaleString('pt-BR')}`)
    return { ok: true as const, message: lines.join('\n') }
  }
}

