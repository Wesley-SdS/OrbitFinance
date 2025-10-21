"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
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
      const accounts = await prisma.financialAccount.findMany({
        where: { userId: session!.user.id },
        orderBy: { createdAt: "desc" },
      })
      setAccounts(accounts)
    } catch (error) {
      console.error("Failed to fetch accounts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await prisma.account.delete({ where: { id } })
      fetchAccounts()
    } catch (error) {
      console.error("Failed to delete account:", error)
    }
  }

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case "CHECKING":
        return "bg-blue-100 text-blue-800"
      case "SAVINGS":
        return "bg-green-100 text-green-800"
      case "CREDIT_CARD":
        return "bg-red-100 text-red-800"
      case "INVESTMENT":
        return "bg-purple-100 text-purple-800"
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
              account.type === "CHECKING"
                ? t("accounts.types.checking")
                : account.type === "SAVINGS"
                ? t("accounts.types.savings")
                : account.type === "CREDIT_CARD"
                ? t("accounts.types.credit")
                : account.type === "INVESTMENT"
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
                <Button variant="outline" size="sm">
                  {t("common.edit")}
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
