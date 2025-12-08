import { Transaction, Goal } from "@prisma/client"

export interface ScoreFactors extends Record<string, number> {
  spendingRatio: number
  emergencyFund: number
  goalProgress: number
  consistency: number
  savings: number
}

interface ScoreResult {
  score: number
  level: "Crítico" | "Atenção" | "Bom" | "Muito Bom" | "Excelente"
  factors: ScoreFactors
  recommendations: string[]
}

export class ScoreCalculatorService {
  calculateSpendingRatio(income: number, expense: number): number {
    if (income === 0) return 0

    const ratio = expense / income

    if (ratio < 0.5) return 300
    if (ratio < 0.7) return 250
    if (ratio < 0.9) return 150
    if (ratio < 1.0) return 75
    return 0
  }

  calculateEmergencyFund(currentBalance: number, monthlyExpenses: number): number {
    if (monthlyExpenses === 0) return 0

    const monthsCovered = currentBalance / monthlyExpenses

    if (monthsCovered >= 6) return 250
    if (monthsCovered >= 3) return 150
    if (monthsCovered >= 1) return 75
    return 0
  }

  calculateGoalProgress(goals: Goal[]): number {
    if (goals.length === 0) return 100

    const completedGoals = goals.filter((g) => g.isCompleted).length
    const activeGoals = goals.filter((g) => !g.isCompleted)

    let progressScore = 0

    if (completedGoals > 0) {
      progressScore += Math.min(100, completedGoals * 50)
    }

    activeGoals.forEach((goal) => {
      const progress = Number(goal.currentAmount) / Number(goal.targetAmount)
      progressScore += progress * 20
    })

    return Math.min(200, progressScore)
  }

  calculateConsistency(transactions: Transaction[]): number {
    if (transactions.length < 7) return 50

    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)

    const recentTransactions = transactions.filter((t) => new Date(t.date) >= last7Days)

    const hasRegularTracking = recentTransactions.length >= 3

    const categoriesUsed = new Set(recentTransactions.map((t) => t.categoryId)).size

    let score = 0

    if (hasRegularTracking) score += 75
    if (categoriesUsed >= 3) score += 75

    return Math.min(150, score)
  }

  calculateSavings(income: number, expense: number): number {
    if (income === 0) return 0

    const savings = income - expense
    const savingsRate = savings / income

    if (savingsRate >= 0.3) return 100
    if (savingsRate >= 0.2) return 75
    if (savingsRate >= 0.1) return 50
    if (savingsRate > 0) return 25
    return 0
  }

  calculate(
    transactions: Transaction[],
    goals: Goal[],
    currentBalance: number
  ): ScoreResult {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentTransactions = transactions.filter((t) => new Date(t.date) >= thirtyDaysAgo)

    const income = recentTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const expense = recentTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const factors: ScoreFactors = {
      spendingRatio: this.calculateSpendingRatio(income, expense),
      emergencyFund: this.calculateEmergencyFund(currentBalance, expense),
      goalProgress: this.calculateGoalProgress(goals),
      consistency: this.calculateConsistency(transactions),
      savings: this.calculateSavings(income, expense),
    }

    const score = Math.min(
      1000,
      factors.spendingRatio +
        factors.emergencyFund +
        factors.goalProgress +
        factors.consistency +
        factors.savings
    )

    let level: ScoreResult["level"]
    if (score >= 800) level = "Excelente"
    else if (score >= 600) level = "Muito Bom"
    else if (score >= 400) level = "Bom"
    else if (score >= 200) level = "Atenção"
    else level = "Crítico"

    const recommendations: string[] = []

    if (factors.spendingRatio < 150) {
      recommendations.push("💸 Reduza seus gastos para menos de 70% da renda")
    }

    if (factors.emergencyFund < 150) {
      recommendations.push("💰 Construa uma reserva de emergência de 3-6 meses de despesas")
    }

    if (factors.goalProgress < 100) {
      recommendations.push("🎯 Defina metas financeiras e contribua regularmente")
    }

    if (factors.consistency < 100) {
      recommendations.push("📝 Registre suas transações diariamente para melhor controle")
    }

    if (factors.savings < 50) {
      recommendations.push("🌱 Aumente sua taxa de poupança para pelo menos 10% da renda")
    }

    return {
      score,
      level,
      factors,
      recommendations,
    }
  }
}

export const scoreCalculator = new ScoreCalculatorService()
