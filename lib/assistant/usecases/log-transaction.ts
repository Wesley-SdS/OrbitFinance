import { PrismaTransactionRepo, PrismaUserRepo } from '../../assistant/repositories'
import { parseAmount, parseCategory, parseDateRelative, parseDescription } from '../nlu'
import { CategoryClassifier } from '../classifier'
import { PostTransactionInsights } from './post-transaction-insights'
import { smartAlerts } from '@/lib/ai/smart-alerts'
import { prisma } from '@/lib/prisma'

export class LogTransaction {
  constructor(
    private readonly users = new PrismaUserRepo(),
    private readonly txRepo = new PrismaTransactionRepo(),
  ) {}

  async execute(input: { phone: string; text: string; type: 'INCOME' | 'EXPENSE' }) {
    const { id: userId } = await this.users.getOrCreateByPhone(input.phone)
    const amount = parseAmount(input.text)
    if (!amount || amount <= 0) return { ok: false as const, message: 'Valor não identificado. Ex.: "gastei 12,50 #mercado"' }
    const occurredAt = parseDateRelative(input.text) ?? new Date()
    let categoryName = parseCategory(input.text) ?? null
    if (!categoryName) {
      const cls = new CategoryClassifier().suggest(input.text, input.type)
      categoryName = cls?.name ?? (input.type === 'INCOME' ? 'renda' : 'geral')
    }
    const description = parseDescription(input.text)
    const created = await this.txRepo.create({ userId, type: input.type, amount, occurredAt, description, categoryName: categoryName ?? undefined })
    // Post insights (async best-effort)
    try { await new PostTransactionInsights().execute({ userId, categoryId: created.categoryId, amount }) } catch {}

    // Smart Alerts (async best-effort)
    try {
      const alerts = await smartAlerts.analyzeTransaction(created, userId, prisma)
      if (alerts.length > 0) {
        const highPriorityAlert = alerts.find(a => a.severity === 'high') || alerts[0]
        console.log(`[Smart Alert] ${highPriorityAlert.type}: ${highPriorityAlert.message}`)
      }
    } catch {}

    const sign = input.type === 'INCOME' ? '+' : '-'
    const formatted = amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    return { ok: true as const, id: created.id, message: `Lançado: ${sign}${formatted} ${description ?? ''}`.trim() }
  }
}
