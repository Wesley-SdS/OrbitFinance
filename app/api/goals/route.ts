import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { userTag } from "@/lib/cache-tags"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const goals = await prisma.goal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ goals })
  } catch (error) {
    console.error("Failed to fetch goals:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const body = await request.json()
    const { name, targetAmount, currentAmount = 0, deadline, category, color, icon, isCompleted } = body

    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        name,
        targetAmount,
        currentAmount,
        deadline: deadline ? new Date(deadline) : null,
        category: category || "savings",
        color: color || "#10b981",
        icon: icon || "target",
        isCompleted: Boolean(isCompleted),
      },
    })

    revalidateTag(userTag(session.user.id, "goals"))
    return NextResponse.json({ goal })
  } catch (error) {
    console.error("Failed to create goal:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
