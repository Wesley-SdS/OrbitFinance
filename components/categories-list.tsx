"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import type { Category } from "@prisma/client"
import { useTranslations } from "next-intl"

export function CategoryForm({ category, onSuccess }: { category?: Category; onSuccess?: () => void }) {
  const [name, setName] = useState(category?.name || "")
  const [type, setType] = useState<"income" | "expense">(category?.type || "expense")
  const [color, setColor] = useState(category?.color || "#6b7280")
  const [icon, setIcon] = useState(category?.icon || "📝")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()
  const t = useTranslations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!session) throw new Error(t("auth.login"))

      const categoryData = {
        name,
        type,
        color,
        icon,
        userId: session.user.id,
      }

      if (category?.id) {
        await prisma.category.update({
          where: { id: category.id },
          data: categoryData,
        })
      } else {
        await prisma.category.create({
          data: categoryData,
        })
      }

      onSuccess?.()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t("common.error"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">{t("categories.name")}</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("categories.name")} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="type">{t("categories.type")}</Label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          <option value="income">{t("transactions.income")}</option>
          <option value="expense">{t("transactions.expense")}</option>
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="color">{t("categories.color")}</Label>
        <Input
          id="color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-full"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="icon">{t("categories.icon")}</Label>
        <Input id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="📝" maxLength={2} />
      </div>

      {error && <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? t("common.loading") : category ? t("categories.edit") : t("categories.new")}
      </Button>
    </form>
  )
}

export function CategoriesList({
  categories: initialCategories,
  type: filterType,
}: {
  categories?: Category[]
  type?: string
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories || [])
  const [isLoading, setIsLoading] = useState(!initialCategories)
  const { data: session } = useSession()
  const t = useTranslations()

  useEffect(() => {
    if (session && !initialCategories) {
      fetchCategories()
    }
  }, [session, initialCategories])

  const fetchCategories = async () => {
    try {
      const fetchedCategories = await prisma.category.findMany({
        where: { userId: session!.user.id },
        orderBy: { createdAt: "desc" },
      })
      setCategories(fetchedCategories)
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await prisma.category.delete({ where: { id } })
      fetchCategories()
    } catch (error) {
      console.error("Failed to delete category:", error)
    }
  }

  if (isLoading) {
    return <div className="p-4 text-center">{t("common.loading")}</div>
  }

  if (categories.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{t("categories.noCategories")}</p>
        <p className="text-muted-foreground mt-2 text-sm">{t("categories.startAdding")}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <div key={category.id} className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
              style={{ backgroundColor: category.color + "20", color: category.color }}
            >
              {category.icon}
            </div>
            <div>
              <p className="font-medium">{category.name}</p>
              <Badge variant={category.type === "income" ? "default" : "secondary"}>{
                category.type === "income" ? t("transactions.income") : t("transactions.expense")
              }</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              {t("common.edit")}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(category.id)}>
              {t("common.delete")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
