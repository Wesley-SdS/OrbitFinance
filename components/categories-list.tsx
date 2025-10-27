"use client"

import type React from "react"
import { useState } from "react"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslations } from "next-intl"
import type { Category } from "@/lib/types"

interface CategoryFormProps {
  category?: Category
  onSuccess?: () => void
}

export function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || "")
  const [type, setType] = useState<"income" | "expense" | "both">(category?.type || "expense")
  const [color, setColor] = useState(category?.color || "#6b7280")
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
        userId: session.user.id,
      }

      const url = category?.id ? `/api/categories/${category.id}` : "/api/categories"
      const method = category?.id ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      })
      
      if (!res.ok) throw new Error(t("common.error"))
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
          <option value="both">{t("categories.both")}</option>
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

      {error && <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? t("common.loading") : category ? t("categories.edit") : t("categories.new")}
      </Button>
    </form>
  )
}

import { Link } from "@/lib/navigation"
import { Badge } from "@/components/ui/badge"

interface CategoriesListProps {
  categories: Category[]
  onDelete?: (id: string) => Promise<void>
}

export function CategoriesList({ categories, onDelete }: CategoriesListProps) {
  const t = useTranslations()

  const handleDelete = async (id: string) => {
    if (onDelete) {
      await onDelete(id)
    }
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
              style={{ backgroundColor: (category.color || "#000") + "20", color: category.color || "#000" }}
            >
              {(category._count?.transactions ?? 0) > 0 ? `${category._count?.transactions ?? 0}` : "📝"}
            </div>
            <div>
              <p className="font-medium">{category.name}</p>
              <Badge variant={category.type === "income" ? "default" : category.type === "expense" ? "secondary" : "outline"}>
                {category.type === "income" ? t("transactions.income") : category.type === "expense" ? t("transactions.expense") : t("categories.both")}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/categories/${category.id}/edit`}>
                {t("common.edit")}
              </Link>
            </Button>
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={() => handleDelete(category.id)}>
                {t("common.delete")}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}