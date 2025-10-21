"use client"

import { useRouter } from "next/navigation"
import { AccountForm } from "@/components/account-form"
import type { FinancialAccount } from "@prisma/client"

interface AccountFormClientProps {
  account?: FinancialAccount
}

export function AccountFormClient({
  account,
}: AccountFormClientProps) {
  const router = useRouter()

  const handleSuccess = () => {
    router.push("/dashboard/accounts")
  }

  return (
    <AccountForm
      account={account}
      onSuccess={handleSuccess}
    />
  )
}