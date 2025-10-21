import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        financialAccount: true,
        category: true,
      },
      orderBy: {
        date: "desc"
      }
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error("Failed to fetch transactions:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { amount, description, notes, type, financialAccountId, categoryId, date } = body

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
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
    console.error("Failed to create transaction:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}