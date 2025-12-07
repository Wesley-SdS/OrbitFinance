import { NextRequest, NextResponse } from "next/server"
import { withApiMiddleware } from "@/lib/api-middleware"
import { prisma } from "@/lib/prisma"
import { generateFinancialInsights } from "@/lib/ai/models"
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

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      deletedAt: null,
      date: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    include: {
      category: true,
      financialAccount: true,
    },
    orderBy: { date: "desc" },
  })

  if (transactions.length === 0) {
    return NextResponse.json(
      { error: "No transactions found for analysis" },
      { status: 400 }
    )
  }

  const insightsResponse = await generateFinancialInsights(transactions)
  const insights = insightsResponse.insights

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
