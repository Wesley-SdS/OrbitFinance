import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { userTag } from "@/lib/cache-tags"

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
      select: {
        id: true,
        amount: true,
        description: true,
        notes: true,
        type: true,
        date: true,
        categoryId: true,
        financialAccountId: true,
        financialAccount: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            type: true,
          },
        },
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

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
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
        select: {
          id: true,
          amount: true,
          description: true,
          notes: true,
          type: true,
          date: true,
          categoryId: true,
          financialAccountId: true,
          financialAccount: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              type: true,
            },
          },
        },
      })

      if (type === "income") {
        await tx.financialAccount.update({
          where: { id: financialAccountId, userId: session.user.id },
          data: { balance: { increment: amount } },
        })
      } else if (type === "expense") {
        await tx.financialAccount.update({
          where: { id: financialAccountId, userId: session.user.id },
          data: { balance: { decrement: amount } },
        })
      }

      return transaction
    })

    revalidateTag(userTag(session.user.id, "transactions"))
    revalidateTag(userTag(session.user.id, "accounts"))
    return NextResponse.json({ transaction: result })
  } catch (error) {
    console.error("Failed to create transaction:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
