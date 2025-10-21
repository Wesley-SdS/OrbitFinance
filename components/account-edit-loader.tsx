"use client"

import { useEffect, useState } from "react"
import { AccountForm } from "@/components/account-form"
import type { FinancialAccount } from "@prisma/client"

export function AccountEditLoader({ id }: { id: string }) {
  const [account, setAccount] = useState<FinancialAccount | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/accounts/${id}`, { cache: "no-store" })
        if (!res.ok) return setAccount(null)
        const json = await res.json()
        setAccount(json.account as FinancialAccount)
      } catch {
        setAccount(null)
      }
    }
    load()
  }, [id])

  if (account === null) return <div className="p-4 text-center">Loading...</div>

  return <AccountForm account={account} />
}

