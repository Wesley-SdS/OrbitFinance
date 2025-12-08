import { Transaction } from "@prisma/client"

interface RecurringTransaction {
  name: string
  amount: number
  frequency: "monthly" | "weekly" | "biweekly"
  category: string | null
  lastCharge: Date
  occurrences: number
  transactions: Array<{
    id: string
    date: Date
    amount: number
    description: string
  }>
}

export class RecurrenceDetectorService {
  private normalizeDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/\d{2}\/\d{2}\/\d{4}/g, "")
      .replace(/\d{2}\/\d{2}/g, "")
      .replace(/\d+/g, "")
      .replace(/[^a-z\s]/g, "")
      .trim()
      .slice(0, 30)
  }

  private calculateDaysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  private determineFrequency(daysDifferences: number[]): "monthly" | "weekly" | "biweekly" | null {
    const avgDays = daysDifferences.reduce((a, b) => a + b, 0) / daysDifferences.length

    if (avgDays >= 25 && avgDays <= 35) return "monthly"
    if (avgDays >= 12 && avgDays <= 18) return "biweekly"
    if (avgDays >= 5 && avgDays <= 9) return "weekly"

    return null
  }

  detectRecurring(transactions: Transaction[]): RecurringTransaction[] {
    const sortedTransactions = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime())

    const grouped = new Map<
      string,
      Array<{ id: string; date: Date; amount: number; description: string; category: string | null }>
    >()

    sortedTransactions.forEach((t) => {
      const normalized = this.normalizeDescription(t.description || "")
      if (normalized.length < 3) return

      if (!grouped.has(normalized)) {
        grouped.set(normalized, [])
      }

      grouped.get(normalized)!.push({
        id: t.id,
        date: t.date,
        amount: Number(t.amount),
        description: t.description || "",
        category: t.categoryId,
      })
    })

    const recurring: RecurringTransaction[] = []

    grouped.forEach((txs, key) => {
      if (txs.length < 2) return

      const amounts = txs.map((t) => t.amount)
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
      const amountVariance = amounts.every((amt) => Math.abs(amt - avgAmount) < avgAmount * 0.15)

      if (!amountVariance) return

      const dates = txs.map((t) => t.date).sort((a, b) => a.getTime() - b.getTime())
      const daysDifferences: number[] = []

      for (let i = 1; i < dates.length; i++) {
        daysDifferences.push(this.calculateDaysDifference(dates[i - 1], dates[i]))
      }

      const frequency = this.determineFrequency(daysDifferences)
      if (!frequency) return

      const lastTransaction = txs[txs.length - 1]

      recurring.push({
        name: lastTransaction.description || "Assinatura desconhecida",
        amount: avgAmount,
        frequency,
        category: lastTransaction.category,
        lastCharge: lastTransaction.date,
        occurrences: txs.length,
        transactions: txs,
      })
    })

    return recurring.sort((a, b) => b.amount - a.amount)
  }

  async saveRecurringTransactions(
    userId: string,
    recurring: RecurringTransaction[],
    prisma: any
  ): Promise<void> {
    await prisma.subscription.deleteMany({
      where: { userId },
    })

    for (const rec of recurring) {
      await prisma.subscription.create({
        data: {
          userId,
          name: rec.name,
          amount: rec.amount,
          frequency: rec.frequency,
          category: rec.category,
          lastCharge: rec.lastCharge,
          isActive: true,
        },
      })
    }
  }
}

export const recurrenceDetector = new RecurrenceDetectorService()
