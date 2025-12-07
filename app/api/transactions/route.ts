import { NextRequest, NextResponse } from "next/server"
import { withApiMiddleware } from "@/lib/api-middleware"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { userTag } from "@/lib/cache-tags"
import { createAuditLog } from "@/lib/audit"

async function getHandler(req: NextRequest) {
  const { userId } = req as any

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      deletedAt: null,
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
      date: "desc",
    },
  })

  return NextResponse.json({ transactions })
}

export async function GET(request: NextRequest) {
  return withApiMiddleware(request, getHandler, {
    requireAuth: true,
    rateLimit: { max: 100, window: 60000 },
  })
}

async function postHandler(req: NextRequest) {
  const { userId } = req as any
  const body = await req.json()
  const { amount, description, notes, type, financialAccountId, categoryId, date } = body

  const result = await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        userId,
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
        where: { id: financialAccountId, userId },
        data: { balance: { increment: amount } },
      })
    } else if (type === "expense") {
      await tx.financialAccount.update({
        where: { id: financialAccountId, userId },
        data: { balance: { decrement: amount } },
      })
    }

    return transaction
  })

  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "transaction",
    entityId: result.id,
    newValues: { amount, type, description },
    ipAddress: req.headers.get("x-forwarded-for") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  })

  revalidateTag(userTag(userId, "transactions"))
  revalidateTag(userTag(userId, "accounts"))
  return NextResponse.json({ transaction: result })
}

export async function POST(request: NextRequest) {
  return withApiMiddleware(request, postHandler, {
    requireAuth: true,
    rateLimit: { max: 100, window: 60000 },
  })
}
