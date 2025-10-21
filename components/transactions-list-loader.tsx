"use client"

import { useEffect, useState } from "react"
import type { Transaction, FinancialAccount, Category } from "@prisma/client"
import { TransactionsList } from "@/components/transactions-list"

type TransactionWithRelations = Transaction & {
  category: Category
  financialAccount: FinancialAccount
}

export function TransactionsListLoader() {
  const [data, setData] = useState<TransactionWithRelations[] | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/transactions", { cache: "no-store" })
        if (!res.ok) return setData([])
        const json = await res.json()
        setData(json.transactions as TransactionWithRelations[])
      } catch {
        setData([])
      }
    }
    load()
  }, [])

  if (!data) return <div className="p-4 text-center">Loading...</div>

  return <TransactionsList transactions={data} accounts={[]} categories={[]} />
}

