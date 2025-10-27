"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Link } from "@/lib/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, decimalToNumber } from "@/lib/utils"
import type { FinancialAccount } from "@prisma/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useTranslations } from "next-intl"

type AccountsListProps = {
  accounts?: FinancialAccount[]
}

export function AccountsList({ accounts: initialAccounts }: AccountsListProps) {
  const [accounts, setAccounts] = useState<FinancialAccount[]>(initialAccounts || [])
  const [isLoading, setIsLoading] = useState(!initialAccounts)
  const { data: session } = useSession()
  const t = useTranslations()

  useEffect(() => {
    if (session && !initialAccounts) {
      fetchAccounts()
    }
  }, [session, initialAccounts])

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load accounts")
      const data = await res.json()
      setAccounts(data.accounts as FinancialAccount[])
    } catch (error) {
      console.error("Failed to fetch accounts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete account")
      fetchAccounts()
    } catch (error) {
      console.error("Failed to delete account:", error)
    }
  }

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case "checking":
        return "bg-blue-100 text-blue-800"
      case "savings":
        return "bg-green-100 text-green-800"
      case "credit_card":
        return "bg-red-100 text-red-800"
      case "investment":
        return "bg-purple-100 text-purple-800"
      case "cash":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return <div className="p-4 text-center">{t("common.loading")}</div>
  }

  if (accounts.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{t("accounts.noAccounts")}</p>
        <p className="text-muted-foreground mt-2 text-sm">{t("accounts.startAdding")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {accounts.map((account) => (
        <Card key={account.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
            <Badge className={getAccountTypeColor(account.type)}>{
              account.type === "checking"
                ? t("accounts.types.checking")
                : account.type === "savings"
                ? t("accounts.types.savings")
                : account.type === "credit_card"
                ? t("accounts.types.credit")
                : account.type === "investment"
                ? t("accounts.types.investment")
                : t("accounts.types.cash")
            }</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(decimalToNumber(account.balance))}</div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-muted-foreground text-xs">
                {t("accounts.createdOn")} {new Date(account.createdAt).toLocaleDateString()}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/accounts/${account.id}/edit`}>
                    {t("common.edit")}
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      {t("common.delete")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("accounts.deleteTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("accounts.deleteConfirm")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(account.id)}>{t("common.delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
