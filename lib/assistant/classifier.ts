import { prisma } from '@/lib/prisma'

export class CategoryClassifier {
  private readonly rules: Array<{ keywords: string[]; category: string; type: 'income' | 'expense' }>
  constructor() {
    this.rules = [
      { keywords: ['mercado', 'supermercado', 'padaria', 'comida', 'almoço', 'jantar'], category: 'alimentacao', type: 'expense' },
      { keywords: ['uber', '99', 'ônibus', 'onibus', 'metro', 'combustível', 'gasolina'], category: 'transporte', type: 'expense' },
      { keywords: ['aluguel', 'condomínio', 'condominio', 'luz', 'água', 'agua', 'internet'], category: 'moradia', type: 'expense' },
      { keywords: ['salario', 'salário', 'freela', 'bonus', 'bônus', 'renda'], category: 'renda', type: 'income' },
      { keywords: ['farmácia', 'farmacia', 'remédio', 'remedio', 'médico', 'medico'], category: 'saude', type: 'expense' },
    ]
  }

  async suggestWithLearning(text: string, typeHint: 'INCOME' | 'EXPENSE', userId?: string): Promise<{ name: string; type: 'income' | 'expense' } | null> {
    if (userId) {
      try {
        const normalizedText = text.toLowerCase().slice(0, 15)
        const feedback = await prisma.categoryFeedback.findFirst({
          where: {
            userId,
            description: {
              contains: normalizedText,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        if (feedback) {
          const type = typeHint === 'INCOME' ? 'income' : 'expense'
          return { name: feedback.correctedCategory, type }
        }
      } catch (error) {
        console.warn('[CategoryClassifier] Failed to fetch feedback:', error)
      }
    }

    return this.suggest(text, typeHint)
  }

  suggest(text: string, typeHint: 'INCOME' | 'EXPENSE'): { name: string; type: 'income' | 'expense' } | null {
    const t = text.toLowerCase()
    const candidates = this.rules.filter(r => (typeHint === 'INCOME' ? r.type === 'income' : r.type === 'expense'))
    for (const r of candidates) {
      if (r.keywords.some(k => t.includes(k))) return { name: r.category, type: r.type }
    }
    return null
  }
}

