"use client"

import { useState } from "react"
import { useSession } from "@/lib/auth-client"
import { CategoriesList } from "@/components/categories-list"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

export function CategoriesListClient({ initialCategories }: { initialCategories: any[] }) {
  const [categories, setCategories] = useState(initialCategories)
  const { data: session } = useSession()
  const t = useTranslations()

  const handleDelete = async (id: string) => {
    if (!session) return

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete category")
      
      setCategories(prev => prev.filter(cat => cat.id !== id))
      toast.success(t("categories.deleted"))
    } catch (error) {
      console.error("Failed to delete category:", error)
      toast.error(t("categories.deleteError"))
    }
  }

  return <CategoriesList categories={categories} onDelete={handleDelete} />
}