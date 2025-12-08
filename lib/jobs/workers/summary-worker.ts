import { prisma } from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

const geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

interface SummaryData {
  income: number
  expense: number
  balance: number
  topCategories: Array<{ category: string; amount: number }>
  transactionCount: number
}

export class SummaryWorker {
  async generateWeeklySummary(userId: string): Promise<string> {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        date: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        category: true,
      },
    })

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const categoryTotals = transactions
      .filter((t) => t.type === "expense")
      .reduce(
        (acc, t) => {
          const cat = t.category?.name || "Outros"
          acc[cat] = (acc[cat] || 0) + Number(t.amount)
          return acc
        },
        {} as Record<string, number>
      )

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category, amount]) => ({ category, amount }))

    const summary = this.formatWeeklySummary({
      income,
      expense,
      balance: income - expense,
      topCategories,
      transactionCount: transactions.length,
    })

    return summary
  }

  async generateMonthlySummary(userId: string): Promise<string> {
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        date: {
          gte: firstDayOfMonth,
        },
      },
      include: {
        category: true,
      },
    })

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const categoryTotals = transactions
      .filter((t) => t.type === "expense")
      .reduce(
        (acc, t) => {
          const cat = t.category?.name || "Outros"
          acc[cat] = (acc[cat] || 0) + Number(t.amount)
          return acc
        },
        {} as Record<string, number>
      )

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }))

    const summary = this.formatMonthlySummary({
      income,
      expense,
      balance: income - expense,
      topCategories,
      transactionCount: transactions.length,
    })

    return summary
  }

  private formatWeeklySummary(data: SummaryData): string {
    const emoji = data.balance > 0 ? "📈" : data.balance < 0 ? "📉" : "➡️"

    let summary = `📊 *Resumo da Semana*\n\n`
    summary += `💰 Receitas: R$ ${data.income.toFixed(2)}\n`
    summary += `💸 Despesas: R$ ${data.expense.toFixed(2)}\n`
    summary += `${emoji} Saldo: R$ ${data.balance.toFixed(2)}\n\n`

    if (data.topCategories.length > 0) {
      summary += `📊 Top 3 Gastos:\n`
      data.topCategories.forEach((cat, i) => {
        summary += `${i + 1}. ${cat.category}: R$ ${cat.amount.toFixed(2)}\n`
      })
    }

    summary += `\n📝 ${data.transactionCount} transações registradas`

    if (data.balance > 0) {
      summary += `\n\n💡 Parabéns! Você guardou R$ ${data.balance.toFixed(2)} esta semana!`
    } else if (data.balance < 0) {
      summary += `\n\n⚠️ Atenção! Você gastou R$ ${Math.abs(data.balance).toFixed(2)} a mais do que recebeu.`
    }

    return summary
  }

  private formatMonthlySummary(data: SummaryData): string {
    const emoji = data.balance > 0 ? "📈" : data.balance < 0 ? "📉" : "➡️"

    let summary = `📊 *Resumo do Mês*\n\n`
    summary += `💰 Receitas: R$ ${data.income.toFixed(2)}\n`
    summary += `💸 Despesas: R$ ${data.expense.toFixed(2)}\n`
    summary += `${emoji} Saldo: R$ ${data.balance.toFixed(2)}\n\n`

    if (data.topCategories.length > 0) {
      summary += `📊 Top 5 Categorias:\n`
      data.topCategories.forEach((cat, i) => {
        const percentage = data.expense > 0 ? (cat.amount / data.expense) * 100 : 0
        summary += `${i + 1}. ${cat.category}: R$ ${cat.amount.toFixed(2)} (${percentage.toFixed(0)}%)\n`
      })
    }

    summary += `\n📝 ${data.transactionCount} transações no mês`

    if (data.balance > 0) {
      const savingsRate = data.income > 0 ? (data.balance / data.income) * 100 : 0
      summary += `\n\n💡 Excelente! Você economizou ${savingsRate.toFixed(0)}% da sua renda!`
    } else if (data.balance < 0) {
      summary += `\n\n⚠️ Atenção! Déficit de R$ ${Math.abs(data.balance).toFixed(2)} neste mês.`
    }

    return summary
  }
}

export const summaryWorker = new SummaryWorker()
