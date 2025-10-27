import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { userTag } from "@/lib/cache-tags"

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const { id } = params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const account = await prisma.financialAccount.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!account) return new NextResponse("Not Found", { status: 404 })
    revalidateTag(userTag(session.user.id, "accounts"))
    return NextResponse.json({ account })
  } catch (error) {
    console.error("Failed to fetch account:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const { id } = params
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { name, type, balance, currency, color, icon, isActive } = body

    const account = await prisma.financialAccount.update({
      where: { 
        id,
        userId: session.user.id
      },
      data: {
        name,
        type,
        balance,
        currency,
        color,
        icon,
        isActive,
      }
    })

    return NextResponse.json({ account })
  } catch (error) {
    console.error("Failed to update account:", error)
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
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await prisma.financialAccount.delete({
      where: { 
        id,
        userId: session.user.id
      }
    })

    revalidateTag(userTag(session.user.id, "accounts"))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete account:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
