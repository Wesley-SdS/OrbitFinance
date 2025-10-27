import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { userTag } from "@/lib/cache-tags"

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const { id } = params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const insight = await prisma.aiInsight.update({
      where: { id, userId: session.user.id },
      data: { isRead: true },
    })
    revalidateTag(userTag(session.user.id, "insights"))
    return NextResponse.json({ insight })
  } catch (error) {
    console.error("Failed to mark insight as read:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const { id } = params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    await prisma.aiInsight.delete({ where: { id, userId: session.user.id } })
    revalidateTag(userTag(session.user.id, "insights"))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete insight:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
