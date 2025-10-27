import { PrismaAiInsightRepo, PrismaTransactionRepo, PrismaUserRepo } from '../../assistant/repositories'

export class PostTransactionInsights {
  constructor(
    private readonly users = new PrismaUserRepo(),
    private readonly txRepo = new PrismaTransactionRepo(),
    private readonly aiRepo = new PrismaAiInsightRepo(),
  ) {}

  async execute(input: { userId: string; categoryId: string; amount: number }) {
    const recent = await this.txRepo.listRecentByCategory(input.userId, input.categoryId, 20)
    if (recent.length < 5) return
    const amounts = recent.map(r => r.amount)
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const variance = amounts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / amounts.length
    const std = Math.sqrt(variance)
    if (input.amount > avg + 2 * std) {
      await this.aiRepo.create({
        userId: input.userId,
        title: 'Gasto atípico detectado',
        content: `Seu gasto de R$ ${input.amount.toFixed(2)} superou a média recente nessa categoria.`,
        insightType: 'budget_alert',
        priority: 'high',
      })
    }
  }
}

