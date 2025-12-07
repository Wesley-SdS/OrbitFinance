import { NextRequest, NextResponse } from "next/server"
import { withApiMiddleware } from "@/lib/api-middleware"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { userTag } from "@/lib/cache-tags"
import { createAuditLog, extractChanges } from "@/lib/audit"

async function getHandler(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = req as any
  const params = await context.params
  const { id } = params

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId, deletedAt: null },
    include: { financialAccount: true, category: true },
  })

  if (!transaction) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 })
  }

  return NextResponse.json({ transaction })
}

async function putHandler(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = req as any
  const params = await context.params
  const { id } = params
  const body = await req.json()
  const { amount, description, notes, type, financialAccountId, categoryId, date } = body

  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findFirst({
      where: { id, userId, deletedAt: null },
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

    if (existing.type === "income") {
      await tx.financialAccount.update({
        where: { id: existing.financialAccountId, userId },
        data: { balance: { decrement: existing.amount } },
      })
    } else if (existing.type === "expense") {
      await tx.financialAccount.update({
        where: { id: existing.financialAccountId, userId },
        data: { balance: { increment: existing.amount } },
      })
    }

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

    const changes = extractChanges(
      { amount: existing.amount, type: existing.type, description: existing.description },
      { amount, type, description }
    )

    await createAuditLog({
      userId,
      action: "UPDATE",
      entity: "transaction",
      entityId: id,
      oldValues: changes.old,
      newValues: changes.new,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    })

    return transaction
  })

  if (!updated) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 })
  }

  revalidateTag(userTag(userId, "transactions"))
  revalidateTag(userTag(userId, "accounts"))
  return NextResponse.json({ transaction: updated })
}

async function deleteHandler(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = req as any
  const params = await context.params
  const { id } = params

  await prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findFirst({
      where: { id, userId, deletedAt: null },
    })

    if (!existing) return

    await tx.transaction.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    if (existing.type === "income") {
      await tx.financialAccount.update({
        where: { id: existing.financialAccountId, userId },
        data: { balance: { decrement: existing.amount } },
      })
    } else if (existing.type === "expense") {
      await tx.financialAccount.update({
        where: { id: existing.financialAccountId, userId },
        data: { balance: { increment: existing.amount } },
      })
    }

    await createAuditLog({
      userId,
      action: "SOFT_DELETE",
      entity: "transaction",
      entityId: id,
      oldValues: { amount: existing.amount, type: existing.type },
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    })
  })

  revalidateTag(userTag(userId, "transactions"))
  revalidateTag(userTag(userId, "accounts"))
  return NextResponse.json({ success: true })
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(
    request,
    (req) => getHandler(req, context),
    { requireAuth: true, rateLimit: { max: 100, window: 60000 } }
  )
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(
    request,
    (req) => putHandler(req, context),
    { requireAuth: true, rateLimit: { max: 100, window: 60000 } }
  )
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(
    request,
    (req) => deleteHandler(req, context),
    { requireAuth: true, rateLimit: { max: 100, window: 60000 } }
  )
}
