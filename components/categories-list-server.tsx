import { CategoriesList } from "@/components/categories-list"
import { getCategories } from "@/lib/queries"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export default async function CategoriesListServer({ type }: { type?: string }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    return <div>User not authenticated</div>
  }

  const categories = await getCategories(session.user.id)
  const filteredCategories = type ? categories.filter(cat => cat.type === type) : categories

  return <CategoriesList categories={filteredCategories} />
}