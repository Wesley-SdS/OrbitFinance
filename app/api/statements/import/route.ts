import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { similarityDetector } from "@/lib/utils/transaction-similarity"

interface ImportTransaction {
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  suggestedCategory: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { transactions, accountId } = body as {
      transactions: ImportTransaction[]
      accountId: string
    }

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: "No transactions provided" }, { status: 400 })
    }

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 })
    }

    const account = await prisma.financialAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    })

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    const startDate = new Date(transactions[0].date)
    const endDate = new Date(transactions[transactions.length - 1].date)
    startDate.setDate(startDate.getDate() - 2)
    endDate.setDate(endDate.getDate() + 2)

    const existingTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        financialAccountId: accountId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
    })

    const filtered = similarityDetector.filterDuplicates(
      transactions.map((t) => ({
        date: new Date(t.date),
        description: t.description,
        amount: t.amount,
      })),
      existingTransactions
    )

    const nonDuplicates = filtered.filter((f) => !f.isDuplicate)
    const duplicates = filtered.filter((f) => f.isDuplicate)

    const categories = await prisma.category.findMany({
      where: {
        userId: session.user.id,
      },
    })

    const importedTransactions = []

    for (const item of nonDuplicates) {
      const originalTx = transactions.find(
        (t) => t.description === item.transaction.description && new Date(t.date).getTime() === item.transaction.date.getTime()
      )

      if (!originalTx) continue

      let category = categories.find(
        (c) => c.name.toLowerCase() === originalTx.suggestedCategory.toLowerCase() && c.type === originalTx.type
      )

      if (!category) {
        category = categories.find((c) => c.name.toLowerCase() === "outros" && c.type === originalTx.type)
      }

      if (!category) {
        category = await prisma.category.create({
          data: {
            userId: session.user.id,
            name: "Outros",
            type: originalTx.type,
            color: "#6b7280",
            icon: "tag",
          },
        })
      }

      const created = await prisma.transaction.create({
        data: {
          userId: session.user.id,
          financialAccountId: accountId,
          categoryId: category.id,
          type: originalTx.type,
          amount: originalTx.amount,
          description: originalTx.description,
          date: new Date(originalTx.date),
        },
      })

      importedTransactions.push(created)
    }

    if (importedTransactions.length > 0) {
      const totalChange = importedTransactions.reduce((sum, t) => {
        return sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount))
      }, 0)

      await prisma.financialAccount.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: totalChange,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      imported: importedTransactions.length,
      duplicates: duplicates.length,
      total: transactions.length,
      transactions: importedTransactions,
      skipped: duplicates.map((d) => ({
        transaction: d.transaction,
        reason: "Duplicate",
        matchedWith: d.matchedTransaction?.id,
      })),
    })
  } catch (error) {
    console.error("Transaction import error:", error)
    return NextResponse.json(
      {
        error: "Failed to import transactions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
