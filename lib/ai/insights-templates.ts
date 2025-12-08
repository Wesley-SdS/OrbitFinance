import { MARKET_DATA, getStocksByDividendYield } from "./market-data"

interface SpendingData {
  category: string
  amount: number
}

interface GoalData {
  name: string
  currentAmount: number
  targetAmount: number
}

export function generateInvestmentComparison(topSpending: SpendingData): string {
  const amount = topSpending.amount
  const highYieldStocks = getStocksByDividendYield(5.0)

  if (highYieldStocks.length === 0) return ""

  const [symbol, stock] = highYieldStocks[0]
  const shares = Math.floor(amount / stock.price)
  const annualDividend = (shares * stock.price * stock.dividendYield) / 100

  return `Você gastou R$ ${amount.toFixed(2)} em ${topSpending.category}. Com esse valor, poderia comprar ${shares} ações ${symbol} (${stock.name}) que pagariam aproximadamente R$ ${annualDividend.toFixed(2)}/ano em dividendos (${stock.dividendYield}% a.a.).`
}

export function generateBehavioralPattern(weekdaySpending: number, weekendSpending: number): string | null {
  if (weekendSpending === 0 || weekdaySpending === 0) return null

  const percentDiff = ((weekendSpending - weekdaySpending) / weekdaySpending) * 100
  const savings = weekendSpending - weekdaySpending

  if (percentDiff > 20) {
    return `Você gasta ${Math.abs(percentDiff).toFixed(0)}% mais aos finais de semana. Reduzindo para a média dos dias úteis, economizaria R$ ${Math.abs(savings).toFixed(2)}/mês.`
  }

  if (percentDiff < -20) {
    return `Parabéns! Você gasta ${Math.abs(percentDiff).toFixed(0)}% menos aos finais de semana. Continue com esse controle!`
  }

  return null
}

export function generateSubscriptionAlert(subscriptions: Array<{ name: string; amount: number }>): string {
  if (subscriptions.length === 0) return ""

  const total = subscriptions.reduce((sum, sub) => sum + sub.amount, 0)
  const annualCost = total * 12

  const subList = subscriptions.map((s) => `${s.name} (R$ ${s.amount})`).join(", ")

  return `Detectamos ${subscriptions.length} assinaturas recorrentes: ${subList}. Total mensal: R$ ${total.toFixed(2)} = R$ ${annualCost.toFixed(2)}/ano. Compare com ${MARKET_DATA.cdi}% do CDI (R$ ${(annualCost * MARKET_DATA.cdi) / 100}/ano).`
}

export function generateAchievement(
  currentMonthExpenses: number,
  lastMonthExpenses: number,
  category?: string
): string | null {
  if (lastMonthExpenses === 0) return null

  const reduction = ((lastMonthExpenses - currentMonthExpenses) / lastMonthExpenses) * 100

  if (reduction > 10) {
    const categoryText = category ? ` com ${category}` : ""
    return `Parabéns! Seus gastos${categoryText} caíram ${reduction.toFixed(0)}% este mês. Você economizou R$ ${(lastMonthExpenses - currentMonthExpenses).toFixed(2)}! Continue assim!`
  }

  return null
}

export function generateGoalProgress(goal: GoalData): string {
  const progress = (goal.currentAmount / goal.targetAmount) * 100
  const remaining = goal.targetAmount - goal.currentAmount

  if (progress >= 80) {
    return `Você está a ${(100 - progress).toFixed(0)}% da meta "${goal.name}"! Faltam apenas R$ ${remaining.toFixed(2)}. Está quase lá!`
  }

  if (progress >= 50) {
    return `Meio caminho andado para "${goal.name}"! Já economizou R$ ${goal.currentAmount.toFixed(2)} de R$ ${goal.targetAmount.toFixed(2)}.`
  }

  return `Mantenha o foco em "${goal.name}". Cada real conta para atingir R$ ${goal.targetAmount.toFixed(2)}.`
}

export function generateCDIComparison(savingsAmount: number): string {
  const monthlyYield = (savingsAmount * MARKET_DATA.cdi) / 100 / 12
  const annualYield = (savingsAmount * MARKET_DATA.cdi) / 100

  return `Com R$ ${savingsAmount.toFixed(2)} investidos a ${MARKET_DATA.cdi}% a.a. (CDI), você teria ~R$ ${monthlyYield.toFixed(2)}/mês ou R$ ${annualYield.toFixed(2)}/ano. Seu dinheiro pode trabalhar por você!`
}

export function generateEmergencyFundTip(monthlyExpenses: number, currentSavings: number): string {
  const idealReserve = monthlyExpenses * 6
  const deficit = Math.max(0, idealReserve - currentSavings)

  if (deficit === 0) {
    return `Excelente! Você já tem uma reserva de emergência adequada. Considere investir em ativos de maior rentabilidade.`
  }

  const monthsToGoal = Math.ceil(deficit / (monthlyExpenses * 0.1))

  return `Reserve de emergência ideal: R$ ${idealReserve.toFixed(2)} (6x despesas). Faltam R$ ${deficit.toFixed(2)}. Guardando 10% da renda mensal, atinge em ~${monthsToGoal} meses.`
}
