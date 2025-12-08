import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { scoreCalculator } from "@/lib/ai/score-calculator"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [transactions, goals, accounts] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId: session.user.id,
          deletedAt: null,
        },
        orderBy: {
          date: "desc",
        },
      }),
      prisma.goal.findMany({
        where: {
          userId: session.user.id,
          deletedAt: null,
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

    const result = scoreCalculator.calculate(transactions, goals, totalBalance)

    await prisma.financialScore.create({
      data: {
        userId: session.user.id,
        score: result.score,
        factors: result.factors,
      },
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("Score calculation error:", error)
    return NextResponse.json(
      {
        error: "Failed to calculate score",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
