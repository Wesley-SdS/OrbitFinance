import { GoogleGenerativeAI } from "@google/generative-ai"
import { MARKET_DATA } from "./market-data"
import {
  generateInvestmentComparison,
  generateBehavioralPattern,
  generateSubscriptionAlert,
  generateAchievement,
} from "./insights-templates"

const geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

interface FinancialData {
  spendingByCategory: Record<string, number>
  totalExpense: number
  totalIncome: number
  balance: number
  goals: Array<{
    name: string
    currentAmount: number
    targetAmount: number
  }>
  recentTransactions?: Array<{
    date: Date
    amount: number
    category: string
    description?: string
  }>
}

interface AdvancedInsight {
  type:
    | "investment_comparison"
    | "behavioral_pattern"
    | "subscription_alert"
    | "achievement"
    | "spending_pattern"
    | "saving_tip"
  title: string
  content: string
  priority: "low" | "medium" | "high"
  emoji?: string
  cta?: {
    text: string
    action: string
  }
}

export async function generateAdvancedInsights(data: FinancialData): Promise<AdvancedInsight[]> {
  const insights: AdvancedInsight[] = []

  const topCategory = Object.entries(data.spendingByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => ({ category: cat, amount }))[0]

  if (topCategory && topCategory.amount > 200) {
    const comparisonText = generateInvestmentComparison(topCategory)
    if (comparisonText) {
      insights.push({
        type: "investment_comparison",
        title: "Seu Gasto Poderia Virar Investimento",
        content: comparisonText,
        priority: "high",
        emoji: "💡",
        cta: {
          text: "Ver alternativas",
          action: "view_investments",
        },
      })
    }
  }

  if (data.recentTransactions && data.recentTransactions.length > 0) {
    const weekdaySpending = data.recentTransactions
      .filter((t) => {
        const day = new Date(t.date).getDay()
        return day >= 1 && day <= 5
      })
      .reduce((sum, t) => sum + t.amount, 0)

    const weekendSpending = data.recentTransactions
      .filter((t) => {
        const day = new Date(t.date).getDay()
        return day === 0 || day === 6
      })
      .reduce((sum, t) => sum + t.amount, 0)

    const avgWeekday = weekdaySpending / 20
    const avgWeekend = weekendSpending / 8

    const behavioralText = generateBehavioralPattern(avgWeekday, avgWeekend)
    if (behavioralText) {
      insights.push({
        type: "behavioral_pattern",
        title: "Padrão de Gastos Identificado",
        content: behavioralText,
        priority: "medium",
        emoji: "📊",
      })
    }
  }

  const subscriptions = detectSubscriptions(data.recentTransactions || [])
  if (subscriptions.length > 0) {
    const subText = generateSubscriptionAlert(subscriptions)
    insights.push({
      type: "subscription_alert",
      title: `${subscriptions.length} Assinaturas Detectadas`,
      content: subText,
      priority: "high",
      emoji: "💳",
      cta: {
        text: "Gerenciar assinaturas",
        action: "view_subscriptions",
      },
    })
  }

  if (data.balance > 0 && data.totalIncome > data.totalExpense) {
    insights.push({
      type: "achievement",
      title: "Saldo Positivo!",
      content: `Parabéns! Você guardou R$ ${(data.totalIncome - data.totalExpense).toFixed(2)} este mês. Com ${MARKET_DATA.cdi}% a.a., renderia R$ ${(((data.totalIncome - data.totalExpense) * MARKET_DATA.cdi) / 100 / 12).toFixed(2)}/mês.`,
      priority: "medium",
      emoji: "🎉",
    })
  }

  if (insights.length < 3) {
    insights.push({
      type: "saving_tip",
      title: "Dica de Economia",
      content: `Revise suas maiores categorias de gasto: ${Object.keys(data.spendingByCategory).slice(0, 3).join(", ")}. Pequenas reduções podem gerar grandes economias.`,
      priority: "low",
      emoji: "💰",
    })
  }

  return insights
}

function detectSubscriptions(
  transactions: Array<{ date: Date; amount: number; description?: string }>
): Array<{ name: string; amount: number }> {
  const grouped = new Map<string, Array<{ date: Date; amount: number }>>()

  transactions.forEach((t) => {
    const desc = (t.description || "").toLowerCase()
    const key = desc.slice(0, 15)
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push({ date: t.date, amount: t.amount })
  })

  const subscriptions: Array<{ name: string; amount: number }> = []

  grouped.forEach((txs, key) => {
    if (txs.length >= 2) {
      const amounts = txs.map((t) => t.amount)
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
      const variance = amounts.every((amt) => Math.abs(amt - avgAmount) < avgAmount * 0.1)

      if (variance) {
        subscriptions.push({
          name: key.trim() || "Assinatura",
          amount: avgAmount,
        })
      }
    }
  })

  return subscriptions
}
