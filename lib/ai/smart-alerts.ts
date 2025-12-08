import { Transaction } from "@prisma/client"

export interface Alert {
  type: "abnormal_spending" | "budget_limit" | "unusual_charge" | "duplicate_charge"
  severity: "low" | "medium" | "high"
  title: string
  message: string
  transactionId?: string
  amount?: number
}

export class SmartAlertsService {
  detectAbnormalSpending(
    transaction: Transaction,
    categoryHistory: Transaction[]
  ): Alert | null {
    if (categoryHistory.length < 3) return null

    const amounts = categoryHistory.map((t) => Number(t.amount))
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const currentAmount = Number(transaction.amount)

    if (currentAmount > avgAmount * 2) {
      return {
        type: "abnormal_spending",
        severity: currentAmount > avgAmount * 3 ? "high" : "medium",
        title: "Gasto Acima do Normal",
        message: `Você gastou R$ ${currentAmount.toFixed(2)} em ${transaction.description}. Sua média nesta categoria é R$ ${avgAmount.toFixed(2)}.`,
        transactionId: transaction.id,
        amount: currentAmount,
      }
    }

    return null
  }

  detectBudgetLimit(
    categorySpending: number,
    categoryBudget: number,
    categoryName: string
  ): Alert | null {
    const percentage = (categorySpending / categoryBudget) * 100

    if (percentage >= 80) {
      return {
        type: "budget_limit",
        severity: percentage >= 100 ? "high" : "medium",
        title: percentage >= 100 ? "Orçamento Excedido!" : "Atingindo Limite do Orçamento",
        message: `Você usou ${percentage.toFixed(0)}% do orçamento de ${categoryName} (R$ ${categorySpending.toFixed(2)} de R$ ${categoryBudget.toFixed(2)})`,
        amount: categorySpending,
      }
    }

    return null
  }

  detectUnusualCharge(
    transaction: Transaction,
    similarTransactions: Transaction[]
  ): Alert | null {
    if (similarTransactions.length === 0) return null

    const amounts = similarTransactions.map((t) => Number(t.amount))
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const currentAmount = Number(transaction.amount)

    const variance = Math.abs(currentAmount - avgAmount) / avgAmount

    if (variance > 0.2) {
      return {
        type: "unusual_charge",
        severity: variance > 0.5 ? "high" : "medium",
        title: "Cobrança Diferente do Habitual",
        message: `${transaction.description} cobrou R$ ${currentAmount.toFixed(2)}, mas geralmente é R$ ${avgAmount.toFixed(2)}. Verifique se está correto.`,
        transactionId: transaction.id,
        amount: currentAmount,
      }
    }

    return null
  }

  detectDuplicateCharge(
    transaction: Transaction,
    recentTransactions: Transaction[]
  ): Alert | null {
    const oneHourAgo = new Date(transaction.date)
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    const duplicates = recentTransactions.filter((t) => {
      if (t.id === transaction.id) return false

      const isSameAmount = Math.abs(Number(t.amount) - Number(transaction.amount)) < 0.01
      const isSimilarDesc = (t.description || "")
        .toLowerCase()
        .includes((transaction.description || "").toLowerCase().slice(0, 10))
      const isRecent = new Date(t.date) >= oneHourAgo

      return isSameAmount && isSimilarDesc && isRecent
    })

    if (duplicates.length > 0) {
      return {
        type: "duplicate_charge",
        severity: "high",
        title: "Possível Cobrança Duplicada",
        message: `Detectamos ${duplicates.length + 1} cobranças similares de R$ ${Number(transaction.amount).toFixed(2)} em menos de 1 hora. Verifique se não é duplicata.`,
        transactionId: transaction.id,
        amount: Number(transaction.amount),
      }
    }

    return null
  }

  async analyzeTransaction(
    transaction: Transaction,
    userId: string,
    prisma: any
  ): Promise<Alert[]> {
    const alerts: Alert[] = []

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [categoryHistory, recentTransactions] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          categoryId: transaction.categoryId,
          deletedAt: null,
          date: {
            gte: thirtyDaysAgo,
          },
          id: {
            not: transaction.id,
          },
        },
        orderBy: {
          date: "desc",
        },
        take: 10,
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          deletedAt: null,
          date: {
            gte: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    const abnormalAlert = this.detectAbnormalSpending(transaction, categoryHistory)
    if (abnormalAlert) alerts.push(abnormalAlert)

    const duplicateAlert = this.detectDuplicateCharge(transaction, recentTransactions)
    if (duplicateAlert) alerts.push(duplicateAlert)

    const similarTransactions = categoryHistory.filter((t: Transaction) => {
      const descSimilarity =
        (t.description || "")
          .toLowerCase()
          .slice(0, 15) ===
        (transaction.description || "")
          .toLowerCase()
          .slice(0, 15)
      return descSimilarity
    })

    if (similarTransactions.length > 0) {
      const unusualAlert = this.detectUnusualCharge(transaction, similarTransactions)
      if (unusualAlert) alerts.push(unusualAlert)
    }

    return alerts
  }
}

export const smartAlerts = new SmartAlertsService()
