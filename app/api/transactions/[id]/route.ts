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
    const { amount, description, notes, type, financialAccountId, categoryId, date } = body

    const transaction = await prisma.transaction.update({
      where: { 
        id,
        userId: session.user.id
      },
      data: {
        amount,
        description,
        notes,
        type,
        financialAccountId,
        categoryId,
        date: new Date(date),
      },
      include: {
        financialAccount: true,
        category: true,
      }
    })

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error("Failed to update transaction:", error)
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

    await prisma.transaction.delete({
      where: { 
        id,
        userId: session.user.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete transaction:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
