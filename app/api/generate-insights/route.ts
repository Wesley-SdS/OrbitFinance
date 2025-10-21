import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateFinancialInsights } from "@/lib/ai/models"
import { revalidateTag } from "next/cache"
import { userTag } from "@/lib/cache-tags"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get user's recent transactions for analysis
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        category: true,
        financialAccount: true,
      },
      orderBy: { date: "desc" },
    })

    if (transactions.length === 0) {
      return new NextResponse("No transactions found for analysis", { status: 400 })
    }

    // Generate insights using AI
    const insightsResponse = await generateFinancialInsights(transactions)
    const insights = insightsResponse.insights

    // Store insights in database
    const savedInsights = await prisma.aiInsight.createMany({
      data: (insights as any[]).map((insight: any) => ({
        title: insight.title,
        content: insight.content,
        insightType: insight.type,
        userId: session.user.id,
        isRead: false,
      })),
    })

    revalidateTag(userTag(session.user.id, "insights"))
    return NextResponse.json({
      message: "Insights generated successfully",
      insightsCreated: savedInsights.count,
    })
  } catch (error) {
    console.error("Generate insights error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
