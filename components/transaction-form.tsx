"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/utils"
import type { FinancialAccount, Category } from "@prisma/client"
import { useTranslations } from "next-intl"

interface TransactionFormProps {
  transaction?: any
  accounts?: FinancialAccount[]
  categories?: Category[]
  onSuccess?: () => void
}

export function TransactionForm({
  transaction,
  accounts: initialAccounts,
  categories: initialCategories,
  onSuccess,
}: TransactionFormProps) {
  const [amount, setAmount] = useState(transaction?.amount?.toString() || "")
  const [description, setDescription] = useState(transaction?.description || "")
  const [notes, setNotes] = useState(transaction?.notes || "")
  const [type, setType] = useState<"income" | "expense">(transaction?.type || "expense")
  const [financialAccountId, setFinancialAccountId] = useState(transaction?.financialAccountId || "")
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || "")
  const [date, setDate] = useState(
    transaction?.date ? new Date(transaction.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<FinancialAccount[]>(initialAccounts || [])
  const [categories, setCategories] = useState<Category[]>(initialCategories || [])
  const t = useTranslations()

  useEffect(() => {
    if (!initialAccounts || !initialCategories) {
      fetchAccountsAndCategories()
    }
  }, [type])

  const fetchAccountsAndCategories = async () => {
    try {
      const [accountsRes, categoriesRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch(`/api/categories?type=${type}`)
      ])

      if (accountsRes.ok && categoriesRes.ok) {
        const [accountsData, categoriesData] = await Promise.all([
          accountsRes.json(),
          categoriesRes.json()
        ])
        setAccounts(accountsData.accounts || [])
        setCategories(categoriesData.categories || [])
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const transactionData = {
        amount: parseFloat(amount),
        description,
        notes,
        type,
        financialAccountId,
        categoryId,
        date: new Date(date).toISOString(),
      }

      const url = transaction?.id 
        ? `/api/transactions/${transaction.id}`
        : '/api/transactions'
      
      const method = transaction?.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t('common.error'))
      }

      onSuccess?.()
    } catch (error) {
      setError(error instanceof Error ? error.message : t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="type">{t("transactions.transactionType")}</Label>
          <Select value={type} onValueChange={(value: "income" | "expense") => setType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">{t("transactions.income")}</SelectItem>
              <SelectItem value="expense">{t("transactions.expense")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">{t("transactions.amount")}</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="account">{t("transactions.account")}</Label>
          <Select value={financialAccountId} onValueChange={setFinancialAccountId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.icon} {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">{t("transactions.category")}</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="description">{t("transactions.description")}</Label>
          <Input
            id="description"
            placeholder={t("transactions.description")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">{t("transactions.date")}</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t("transactions.notes")}</Label>
        <Textarea
          id="notes"
          placeholder={t("transactions.notesPlaceholder")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || !amount || !description || !financialAccountId || !categoryId}
      >
        {isLoading ? t("common.loading") : transaction?.id ? t("transactions.edit") : t("transactions.new")}
      </Button>
    </form>
  )
}
