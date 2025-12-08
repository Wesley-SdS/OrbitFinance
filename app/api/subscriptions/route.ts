import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { recurrenceDetector } from "@/lib/ai/recurrence-detector"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const refresh = searchParams.get("refresh") === "true"

    if (refresh) {
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

      const transactions = await prisma.transaction.findMany({
        where: {
          userId: session.user.id,
          type: "expense",
          deletedAt: null,
          date: {
            gte: threeMonthsAgo,
          },
        },
        orderBy: {
          date: "asc",
        },
      })

      const recurring = recurrenceDetector.detectRecurring(transactions)
      await recurrenceDetector.saveRecurringTransactions(session.user.id, recurring, prisma)
    }

    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        amount: "desc",
      },
    })

    const total = subscriptions.reduce((sum, sub) => sum + Number(sub.amount), 0)
    const monthlyTotal = subscriptions
      .filter((s) => s.frequency === "monthly")
      .reduce((sum, sub) => sum + Number(sub.amount), 0)

    const annualCost = total * 12

    return NextResponse.json({
      success: true,
      subscriptions,
      summary: {
        total,
        monthlyTotal,
        annualCost,
        count: subscriptions.length,
      },
    })
  } catch (error) {
    console.error("Subscriptions fetch error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch subscriptions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const subscriptionId = searchParams.get("id")

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 })
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: session.user.id,
      },
    })

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: "Subscription deactivated",
    })
  } catch (error) {
    console.error("Subscription delete error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
