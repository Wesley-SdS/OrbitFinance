import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { userTag } from "@/lib/cache-tags"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const goal = await prisma.goal.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!goal) return new NextResponse("Not Found", { status: 404 })
    revalidateTag(userTag(session.user.id, "goals"))
    return NextResponse.json({ goal })
  } catch (error) {
    console.error("Failed to fetch goal:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const body = await request.json()
    const { name, targetAmount, currentAmount, deadline, category, color, icon, isCompleted } = body

    const goal = await prisma.goal.update({
      where: { id, userId: session.user.id },
      data: {
        name,
        targetAmount,
        currentAmount,
        deadline: deadline ? new Date(deadline) : null,
        category,
        color,
        icon,
        isCompleted,
      },
    })

    return NextResponse.json({ goal })
  } catch (error) {
    console.error("Failed to update goal:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    await prisma.goal.delete({ where: { id, userId: session.user.id } })
    revalidateTag(userTag(session.user.id, "goals"))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete goal:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
