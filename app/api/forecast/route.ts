import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { forecastService } from "@/lib/ai/forecast-service"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const [transactions, subscriptions, accounts] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId: session.user.id,
          deletedAt: null,
          date: {
            gte: threeMonthsAgo,
          },
        },
        orderBy: {
          date: "desc",
        },
      }),
      prisma.subscription.findMany({
        where: {
          userId: session.user.id,
          isActive: true,
        },
      }),
      prisma.financialAccount.findMany({
        where: {
          userId: session.user.id,
          isActive: true,
        },
      }),
    ])

    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)

    const forecast = forecastService.generateForecast(
      transactions,
      totalBalance,
      subscriptions.map((s) => ({
        amount: Number(s.amount),
        frequency: s.frequency,
      }))
    )

    return NextResponse.json({
      success: true,
      currentBalance: totalBalance,
      forecast,
    })
  } catch (error) {
    console.error("Forecast error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate forecast",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
