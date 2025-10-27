import { PrismaTransactionRepo, PrismaUserRepo } from '../../assistant/repositories'
import { extractRange } from '../nlu'

export class GenerateReport {
  constructor(
    private readonly users = new PrismaUserRepo(),
    private readonly txRepo = new PrismaTransactionRepo(),
  ) {}

  async execute(input: { phone: string; text: string }) {
    const { id: userId } = await this.users.getOrCreateByPhone(input.phone)
    const range = extractRange(input.text) ?? (() => {
      const now = new Date()
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      return { from, to }
    })()
    const txs = await this.txRepo.listByPeriod(userId, range.from, range.to)
    const income = txs.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0)
    const expense = txs.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0)
    const net = income - expense
    const byCat = new Map<string, number>()
    for (const t of txs) {
      const key = t.category ?? 'sem categoria'
      byCat.set(key, (byCat.get(key) ?? 0) + (t.type === 'INCOME' ? t.amount : -t.amount))
    }
    const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    const lines = [
      `Receitas: ${fmt(income)}`,
      `Despesas: ${fmt(expense)}`,
      `Saldo: ${fmt(net)}`,
      'Categorias:',
      ...Array.from(byCat.entries()).map(([k, v]) => `  • ${k}: ${fmt(v)}`),
    ]
    return { ok: true as const, message: lines.join('\n') }
  }
}

