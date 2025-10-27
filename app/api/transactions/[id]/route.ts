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

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
      include: { financialAccount: true, category: true },
    })

    if (!transaction) return new NextResponse("Not Found", { status: 404 })
    return NextResponse.json({ transaction })
  } catch (error) {
    console.error("Failed to fetch transaction:", error)
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
    const { amount, description, notes, type, financialAccountId, categoryId, date } = body

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findFirst({
        where: { id, userId: session.user.id },
        select: { id: true, amount: true, type: true, financialAccountId: true },
      })

      if (!existing) return null

      const transaction = await tx.transaction.update({
        where: { id },
        data: {
          amount,
          description,
          notes,
          type,
          financialAccountId,
          categoryId,
          date: new Date(date),
        },
        include: { financialAccount: true, category: true },
      })

      // Reverse old effect
      if (existing.type === "income") {
        await tx.financialAccount.update({
          where: { id: existing.financialAccountId, userId: session.user.id },
          data: { balance: { decrement: existing.amount } },
        })
      } else if (existing.type === "expense") {
        await tx.financialAccount.update({
          where: { id: existing.financialAccountId, userId: session.user.id },
          data: { balance: { increment: existing.amount } },
        })
      }

      // Apply new effect
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

    if (!updated) return new NextResponse("Not Found", { status: 404 })
    revalidateTag(userTag(session.user.id, "transactions"))
    revalidateTag(userTag(session.user.id, "accounts"))
    return NextResponse.json({ transaction: updated })
  } catch (error) {
    console.error("Failed to update transaction:", error)
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

    await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findFirst({
        where: { id, userId: session.user.id },
        select: { id: true, amount: true, type: true, financialAccountId: true },
      })
      if (!existing) return

      await tx.transaction.delete({ where: { id } })

      if (existing.type === "income") {
        await tx.financialAccount.update({
          where: { id: existing.financialAccountId, userId: session.user.id },
          data: { balance: { decrement: existing.amount } },
        })
      } else if (existing.type === "expense") {
        await tx.financialAccount.update({
          where: { id: existing.financialAccountId, userId: session.user.id },
          data: { balance: { increment: existing.amount } },
        })
      }
    })

    revalidateTag(userTag(session.user.id, "transactions"))
    revalidateTag(userTag(session.user.id, "accounts"))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete transaction:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
