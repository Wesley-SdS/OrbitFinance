"use client"

import { useEffect, useState } from "react"
import { TransactionForm } from "@/components/transaction-form"
import type { Transaction, FinancialAccount, Category } from "@prisma/client"

type TransactionWithRelations = Transaction & {
  category: Category
  financialAccount: FinancialAccount
}

export function TransactionEditLoader({ id }: { id: string }) {
  const [transaction, setTransaction] = useState<TransactionWithRelations | null>(null)
  const [accounts, setAccounts] = useState<FinancialAccount[] | null>(null)
  const [categories, setCategories] = useState<Category[] | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [txRes, accRes, catRes] = await Promise.all([
          fetch(`/api/transactions/${id}`, { cache: "no-store" }),
          fetch(`/api/accounts`, { cache: "no-store" }),
          fetch(`/api/categories`, { cache: "no-store" }),
        ])
        const [txJson, accJson, catJson] = await Promise.all([
          txRes.ok ? txRes.json() : { transaction: null },
          accRes.ok ? accRes.json() : { accounts: [] },
          catRes.ok ? catRes.json() : { categories: [] },
        ])
        setTransaction(txJson.transaction as TransactionWithRelations)
        setAccounts(accJson.accounts as FinancialAccount[])
        setCategories((catJson.categories as Category[]) || [])
      } catch {
        setTransaction(null)
        setAccounts([])
        setCategories([])
      }
    }
    load()
  }, [id])

  if (transaction === null || accounts === null || categories === null) {
    return <div className="p-4 text-center">Loading...</div>
  }

  const filteredCategories = categories.filter((c) => c.type === (transaction.type as any))

  return (
    <TransactionForm
      transaction={transaction}
      accounts={accounts}
      categories={filteredCategories}
    />
  )
}
