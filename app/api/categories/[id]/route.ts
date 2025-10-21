import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
  { params }: { params: { id: string } }
) {
  try {
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete category:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
