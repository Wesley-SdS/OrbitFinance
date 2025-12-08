import { Transaction, Goal } from "@prisma/client"

interface MonthlyForecast {
  month: string
  year: number
  expectedIncome: number
  expectedExpenses: number
  projectedBalance: number
  alert: string | null
  breakdown: {
    recurring: number
    variable: number
    seasonal: number
  }
}

interface ForecastResult {
  months: MonthlyForecast[]
  recommendations: string[]
  emergencyFundStatus: {
    current: number
    recommended: number
    monthsCovered: number
  }
}

export class ForecastService {
  private getMonthName(monthIndex: number): string {
    const months = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ]
    return months[monthIndex]
  }

  private calculateRecurringIncome(transactions: Transaction[]): number {
    const incomes = transactions.filter((t) => t.type === "income")
    if (incomes.length === 0) return 0

    const amounts = incomes.map((t) => Number(t.amount))
    return amounts.reduce((a, b) => a + b, 0) / amounts.length
  }

  private calculateRecurringExpenses(transactions: Transaction[]): number {
    const expenses = transactions.filter((t) => t.type === "expense")
    if (expenses.length === 0) return 0

    const grouped = new Map<string, number[]>()

    expenses.forEach((t) => {
      const desc = (t.description || "").toLowerCase().slice(0, 20)
      if (!grouped.has(desc)) grouped.set(desc, [])
      grouped.get(desc)!.push(Number(t.amount))
    })

    let recurringTotal = 0
    grouped.forEach((amounts) => {
      if (amounts.length >= 2) {
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
        recurringTotal += avg
      }
    })

    return recurringTotal
  }

  private calculateVariableExpenses(transactions: Transaction[]): number {
    const expenses = transactions.filter((t) => t.type === "expense")
    const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0)
    const recurring = this.calculateRecurringExpenses(transactions)

    return Math.max(0, totalExpenses - recurring) / (transactions.length > 0 ? 1 : 1)
  }

  private getSeasonalAdjustment(month: number): number {
    if (month === 0) return 1.3
    if (month === 11) return 1.25
    if (month === 6) return 1.1
    return 1.0
  }

  generateForecast(
    transactions: Transaction[],
    currentBalance: number,
    subscriptions: Array<{ amount: number; frequency: string }>
  ): ForecastResult {
    const recurringIncome = this.calculateRecurringIncome(transactions)
    const recurringExpenses = this.calculateRecurringExpenses(transactions)
    const variableExpenses = this.calculateVariableExpenses(transactions)

    const subscriptionTotal = subscriptions
      .filter((s) => s.frequency === "monthly")
      .reduce((sum, s) => sum + s.amount, 0)

    const months: MonthlyForecast[] = []
    let runningBalance = currentBalance

    const today = new Date()

    for (let i = 0; i < 3; i++) {
      const forecastDate = new Date(today)
      forecastDate.setMonth(today.getMonth() + i + 1)

      const monthIndex = forecastDate.getMonth()
      const year = forecastDate.getFullYear()

      const seasonalFactor = this.getSeasonalAdjustment(monthIndex)

      const expectedIncome = recurringIncome
      const seasonal = variableExpenses * (seasonalFactor - 1)
      const expectedExpenses = recurringExpenses + subscriptionTotal + variableExpenses + seasonal

      const monthlyDelta = expectedIncome - expectedExpenses
      runningBalance += monthlyDelta

      let alert: string | null = null
      if (runningBalance < 0) {
        alert = `⚠️ ALERTA: Saldo projetado negativo! Déficit de R$ ${Math.abs(runningBalance).toFixed(2)}`
      } else if (runningBalance < recurringExpenses) {
        alert = `⚠️ ATENÇÃO: Saldo abaixo da reserva mínima (R$ ${runningBalance.toFixed(2)})`
      }

      months.push({
        month: this.getMonthName(monthIndex),
        year,
        expectedIncome,
        expectedExpenses,
        projectedBalance: runningBalance,
        alert,
        breakdown: {
          recurring: recurringExpenses + subscriptionTotal,
          variable: variableExpenses,
          seasonal,
        },
      })
    }

    const recommendations: string[] = []
    const avgMonthlyExpense = recurringExpenses + subscriptionTotal + variableExpenses
    const emergencyFundRecommended = avgMonthlyExpense * 6
    const monthsCovered = currentBalance / avgMonthlyExpense

    if (months.some((m) => m.projectedBalance < 0)) {
      recommendations.push("🚨 Reduza gastos imediatamente para evitar saldo negativo")
    }

    if (monthsCovered < 3) {
      recommendations.push(`💰 Priorize construir reserva de emergência (faltam R$ ${(emergencyFundRecommended - currentBalance).toFixed(2)})`)
    }

    if (subscriptionTotal > recurringIncome * 0.15) {
      recommendations.push(`📱 Assinaturas representam ${((subscriptionTotal / recurringIncome) * 100).toFixed(0)}% da renda. Considere cancelar serviços não essenciais.`)
    }

    if (months[0].breakdown.seasonal > variableExpenses * 0.5) {
      recommendations.push(`🎄 Mês com gastos sazonais elevados. Planeje com antecedência.`)
    }

    return {
      months,
      recommendations,
      emergencyFundStatus: {
        current: currentBalance,
        recommended: emergencyFundRecommended,
        monthsCovered: Math.max(0, monthsCovered),
      },
    }
  }
}

export const forecastService = new ForecastService()
