"use client"

import type React from "react"
import { useState } from "react"
import { Link } from "@/lib/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import type { Transaction, FinancialAccount, Category } from "@prisma/client"
import { Edit, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

type TransactionWithRelations = Transaction & {
  category: Category
  financialAccount: FinancialAccount
}

export function TransactionsList({
  transactions,
  accounts,
  categories,
}: {
  transactions: TransactionWithRelations[]
  accounts: Pick<FinancialAccount, "id" | "name">[]
  categories: Pick<Category, "id" | "name" | "type">[]
}) {
  const [localTransactions, setLocalTransactions] = useState(transactions)
  const t = useTranslations("transactions")
  const tCommon = useTranslations("common")

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) {
      return
    }

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setLocalTransactions((prev) => prev.filter((t) => t.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "income":
        return "bg-green-100 text-green-800"
      case "expense":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (localTransactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{t("noTransactions")}</p>
        <p className="text-muted-foreground mt-2 text-sm">{t("startAdding")}</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/transactions/new">{t("new")}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {localTransactions.map((transaction) => (
        <div key={transaction.id} className="rounded-lg border p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getTypeColor(transaction.type)}>
                  {transaction.type === "income" ? t("income") : t("expense")}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {transaction.category.icon} {transaction.category.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {transaction.financialAccount.icon} {transaction.financialAccount.name}
                </span>
              </div>
              <h3 className="font-medium mb-1">{transaction.description}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(transaction.date).toLocaleDateString()}
              </p>
              {transaction.notes && (
                <p className="text-sm text-muted-foreground mt-2">{transaction.notes}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`font-semibold ${
                  transaction.type === "income" ? "text-green-600" : "text-red-600"
                }`}
              >
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency(Number(transaction.amount))}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/transactions/${transaction.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(transaction.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
