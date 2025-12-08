import { Transaction } from "@prisma/client"

interface ChallengeTemplate {
  type: "reduce_category" | "save_amount" | "no_spending" | "streak"
  description: string
  targetValue?: number
  duration: number
}

export class ChallengeGeneratorService {
  generateReduceCategoryChallenge(
    categoryName: string,
    currentSpending: number
  ): ChallengeTemplate {
    const targetReduction = currentSpending * 0.5

    return {
      type: "reduce_category",
      description: `Reduza gastos em ${categoryName} pela metade esta semana`,
      targetValue: targetReduction,
      duration: 7,
    }
  }

  generateSaveAmountChallenge(monthlyIncome: number): ChallengeTemplate {
    const targetSavings = Math.max(100, monthlyIncome * 0.1)

    return {
      type: "save_amount",
      description: `Guarde R$ ${targetSavings.toFixed(0)} extras esta semana`,
      targetValue: targetSavings,
      duration: 7,
    }
  }

  generateNoSpendingChallenge(categoryName: string): ChallengeTemplate {
    return {
      type: "no_spending",
      description: `Semana sem gastos em ${categoryName}`,
      targetValue: 0,
      duration: 7,
    }
  }

  generateStreakChallenge(): ChallengeTemplate {
    return {
      type: "streak",
      description: `Registre todas as suas transações por 7 dias consecutivos`,
      targetValue: 7,
      duration: 7,
    }
  }

  async generateChallenges(
    userId: string,
    transactions: Transaction[]
  ): Promise<ChallengeTemplate[]> {
    const challenges: ChallengeTemplate[] = []

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentTransactions = transactions.filter((t) => new Date(t.date) >= thirtyDaysAgo)

    const categorySpending = recentTransactions
      .filter((t) => t.type === "expense")
      .reduce(
        (acc, t) => {
          const cat = t.categoryId || "outros"
          acc[cat] = (acc[cat] || 0) + Number(t.amount)
          return acc
        },
        {} as Record<string, number>
      )

    const topCategory = Object.entries(categorySpending).sort(([, a], [, b]) => b - a)[0]

    if (topCategory && topCategory[1] > 200) {
      challenges.push(
        this.generateReduceCategoryChallenge(topCategory[0], topCategory[1])
      )
    }

    const income = recentTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    if (income > 0) {
      challenges.push(this.generateSaveAmountChallenge(income))
    }

    const deliveryCategories = ["alimentação", "delivery", "restaurante"]
    const hasHighDelivery = Object.entries(categorySpending).some(
      ([cat, amount]) => deliveryCategories.includes(cat.toLowerCase()) && amount > 300
    )

    if (hasHighDelivery) {
      challenges.push(this.generateNoSpendingChallenge("delivery"))
    }

    challenges.push(this.generateStreakChallenge())

    return challenges.slice(0, 3)
  }

  async createChallenges(userId: string, prisma: any): Promise<void> {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        date: "desc",
      },
    })

    const challenges = await this.generateChallenges(userId, transactions)

    await prisma.challenge.deleteMany({
      where: {
        userId,
        status: "proposed",
      },
    })

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 7)

    for (const challenge of challenges) {
      await prisma.challenge.create({
        data: {
          userId,
          type: challenge.type,
          description: challenge.description,
          targetValue: challenge.targetValue || null,
          currentValue: 0,
          status: "proposed",
          startDate,
          endDate,
        },
      })
    }
  }
}

export const challengeGenerator = new ChallengeGeneratorService()
