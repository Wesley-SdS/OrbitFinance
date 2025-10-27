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

    const category = await prisma.category.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!category) return new NextResponse("Not Found", { status: 404 })
    revalidateTag(userTag(session.user.id, "categories"))
    return NextResponse.json({ category })
  } catch (error) {
    console.error("Failed to fetch category:", error)
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
    const { name, type, color, icon } = body

    const category = await prisma.category.update({
      where: { 
        id,
        userId: session.user.id
      },
      data: {
        name,
        type,
        color,
        icon,
      }
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Failed to update category:", error)
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

    await prisma.category.delete({
      where: { 
        id,
        userId: session.user.id
      }
    })

    revalidateTag(userTag(session.user.id, "categories"))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete category:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
