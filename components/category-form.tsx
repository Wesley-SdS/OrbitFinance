"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Category } from "@prisma/client"
import { useTranslations } from "next-intl"

interface CategoryFormProps {
  category?: Category
  onSuccess?: () => void
}

export function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || "")
  const [type, setType] = useState<"income" | "expense">(category?.type || "expense")
  const [color, setColor] = useState(category?.color || "#6b7280")
  const [icon, setIcon] = useState(category?.icon || "📝")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const categoryData = {
        name,
        type,
        color,
        icon,
      }

      const url = category?.id 
        ? `/api/categories/${category.id}`
        : '/api/categories'
      
      const method = category?.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
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

      <div className="space-y-2">
        <Label htmlFor="name">{t("categories.name")}</Label>
        <Input
          id="name"
          placeholder={t("categories.name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">{t("categories.type")}</Label>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
        <Label htmlFor="color">{t("categories.color")}</Label>
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
        <Label htmlFor="icon">{t("categories.icon")}</Label>
          <Input
            id="icon"
            placeholder="📝"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            maxLength={2}
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || !name}
      >
        {isLoading ? t("common.loading") : category?.id ? t("categories.edit") : t("categories.new")}
      </Button>
    </form>
  )
}
