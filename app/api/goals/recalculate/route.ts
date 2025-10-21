import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
        isCompleted: false,
      },
      include: {
        // Note: In a real implementation, you'd calculate this from transaction data
        // For now, we'll use the existing currentAmount field
      },
    })

    const updatedGoals = []

    for (const goal of goals) {
      // Calculate progress based on transactions
      // This is a simplified calculation - in a real app you'd sum relevant transactions
      const currentAmount = goal.currentAmount // Keep existing value for now
      const progress = goal.targetAmount.gt(0) ? currentAmount.div(goal.targetAmount).mul(100).toNumber() : 0
      const isCompleted = progress >= 100

      // Update goal if status changed
      if (isCompleted !== goal.isCompleted) {
        const updated = await prisma.goal.update({
          where: { id: goal.id },
          data: {
            isCompleted,
            currentAmount,
          },
        })
        updatedGoals.push(updated)
      }
    }

    return NextResponse.json({
      message: "Goals recalculated successfully",
      updatedGoals: updatedGoals.length,
    })
  } catch (error) {
    console.error("Recalculate goals error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
