import { NextRequest, NextResponse } from "next/server"
import { withApiMiddleware } from "@/lib/api-middleware"
import { prisma } from "@/lib/prisma"
import { generateFinancialInsights } from "@/lib/ai/models"
import { generateAdvancedInsights } from "@/lib/ai/advanced-insights"
import { revalidateTag } from "next/cache"
import { userTag } from "@/lib/cache-tags"
import { aiLimiter, RateLimitError } from "@/lib/rate-limit"

async function handler(req: NextRequest) {
  const { userId } = req as any

  try {
    await aiLimiter.check(10, userId)
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: "AI generation limit reached. Please try again later." },
        { status: 429 }
      )
    }
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [transactions, goals] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        date: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        category: true,
        financialAccount: true,
      },
      orderBy: { date: "desc" },
    }),
    prisma.goal.findMany({
      where: {
        userId,
        deletedAt: null,
      },
    }),
  ])

  if (transactions.length === 0) {
    return NextResponse.json({ error: "No transactions found for analysis" }, { status: 400 })
  }

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const spendingByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => {
        const categoryName = t.category?.name || "Outros"
        acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount)
        return acc
      },
      {} as Record<string, number>
    )

  const balance = totalIncome - totalExpense

  const insights = await generateAdvancedInsights({
    spendingByCategory,
    totalExpense,
    totalIncome,
    balance,
    goals: goals.map((g) => ({
      name: g.name,
      currentAmount: Number(g.currentAmount),
      targetAmount: Number(g.targetAmount),
    })),
    recentTransactions: transactions.map((t) => ({
      date: t.date,
      amount: Number(t.amount),
      category: t.category?.name || "Outros",
      description: t.description || "",
    })),
  })

  const savedInsights = await prisma.aiInsight.createMany({
    data: (insights as any[]).map((insight: any) => ({
      title: insight.title,
      content: insight.content,
      insightType: insight.type,
      userId,
      isRead: false,
    })),
  })

  revalidateTag(userTag(userId, "insights"))
  return NextResponse.json({
    message: "Insights generated successfully",
    insightsCreated: savedInsights.count,
  })
}

export async function POST(request: NextRequest) {
  return withApiMiddleware(request, handler, {
    requireAuth: true,
    rateLimit: { max: 100, window: 60000 },
  })
}
