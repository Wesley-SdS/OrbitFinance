"use client"

import { useRouter } from "next/navigation"
import { TransactionForm } from "@/components/transaction-form"
import type { FinancialAccount, Category } from "@prisma/client"

interface TransactionFormClientProps {
  accounts: FinancialAccount[]
  categories: Category[]
  transaction?: any
}

export function TransactionFormClient({
  accounts,
  categories,
  transaction,
}: TransactionFormClientProps) {
  const router = useRouter()

  const handleSuccess = () => {
    router.push("/dashboard/transactions")
  }

  return (
    <TransactionForm
      transaction={transaction}
      accounts={accounts}
      categories={categories}
      onSuccess={handleSuccess}
    />
  )
}