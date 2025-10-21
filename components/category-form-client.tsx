"use client"

import { useRouter } from "next/navigation"
import { CategoryForm } from "@/components/category-form"
import type { Category } from "@prisma/client"

interface CategoryFormClientProps {
  category?: Category
}

export function CategoryFormClient({
  category,
}: CategoryFormClientProps) {
  const router = useRouter()

  const handleSuccess = () => {
    router.push("/dashboard/categories")
  }

  return (
    <CategoryForm
      category={category}
      onSuccess={handleSuccess}
    />
  )
}