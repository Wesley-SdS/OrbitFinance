"use client"

import { useEffect, useState } from "react"
import { CategoryForm } from "@/components/category-form"
import type { Category } from "@prisma/client"

export function CategoryEditLoader({ id }: { id: string }) {
  const [category, setCategory] = useState<Category | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/categories/${id}`, { cache: "no-store" })
        if (!res.ok) return setCategory(null)
        const json = await res.json()
        setCategory(json.category as Category)
      } catch {
        setCategory(null)
      }
    }
    load()
  }, [id])

  if (category === null) return <div className="p-4 text-center">Loading...</div>

  return <CategoryForm category={category} />
}

