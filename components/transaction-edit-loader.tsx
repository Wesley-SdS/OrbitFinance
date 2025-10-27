"use client"

import { useEffect, useState } from "react"
import { TransactionForm } from "@/components/transaction-form"
import type { CategoryBasic, AccountBasic } from "@/lib/types"

export function TransactionEditLoader({ id }: { id: string }) {
  const [transaction, setTransaction] = useState<any | null>(null)
  const [accounts, setAccounts] = useState<AccountBasic[] | null>(null)
  const [categories, setCategories] = useState<CategoryBasic[] | null>(null)

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
        setTransaction(txJson.transaction as any)
        setAccounts(accJson.accounts as AccountBasic[])
        setCategories((catJson.categories as CategoryBasic[]) || [])
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
