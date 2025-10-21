"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { FinancialAccount } from "@prisma/client"
import { useTranslations } from "next-intl"

interface AccountFormProps {
  account?: FinancialAccount
  onSuccess?: () => void
}

export function AccountForm({ account, onSuccess }: AccountFormProps) {
  const [name, setName] = useState(account?.name || "")
  const [type, setType] = useState<"checking" | "savings" | "credit_card" | "cash" | "investment" | "other">(
    (account?.type as any) || "checking"
  )
  const [balance, setBalance] = useState(account?.balance?.toString() || "0")
  const [currency, setCurrency] = useState(account?.currency || "BRL")
  const [color, setColor] = useState(account?.color || "#3b82f6")
  const [icon, setIcon] = useState(account?.icon || "wallet")
  const [isActive, setIsActive] = useState(account?.isActive ?? true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const accountData = {
        name,
        type,
        balance: parseFloat(balance),
        currency,
        color,
        icon,
        isActive,
      }

      const url = account?.id 
        ? `/api/accounts/${account.id}`
        : '/api/accounts'
      
      const method = account?.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
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
          <Label htmlFor="name">{t("accounts.name")}</Label>
          <Input
            id="name"
            placeholder={t("accounts.name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">{t("accounts.type")}</Label>
          <Select value={type} onValueChange={(value: any) => setType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checking">{t("accounts.types.checking")}</SelectItem>
              <SelectItem value="savings">{t("accounts.types.savings")}</SelectItem>
              <SelectItem value="credit_card">{t("accounts.types.credit")}</SelectItem>
              <SelectItem value="cash">{t("accounts.types.cash")}</SelectItem>
              <SelectItem value="investment">{t("accounts.types.investment")}</SelectItem>
              <SelectItem value="other">{t("accounts.types.other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="balance">{t("accounts.balance")}</Label>
          <Input
            id="balance"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">{t("accounts.currency")}</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">BRL - Brazilian Real</SelectItem>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="GBP">GBP - British Pound</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="color">{t("accounts.color")}</Label>
          <div className="flex gap-2">
            <Input
              id="color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-16 h-10"
            />
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="icon">{t("accounts.icon")}</Label>
          <Input
            id="icon"
            placeholder="💼"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            maxLength={2}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
        <Label htmlFor="isActive">{t("accounts.active")}</Label>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || !name}
      >
        {isLoading ? t("common.loading") : account?.id ? t("accounts.edit") : t("accounts.new")}
      </Button>
    </form>
  )
}
