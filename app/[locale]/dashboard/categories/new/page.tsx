import { CategoryFormClient } from "@/components/category-form-client"

export default function NewCategoryPage() {
  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Category</h1>
        <p className="text-muted-foreground">Create a new category for your transactions</p>
      </div>

      <CategoryFormClient />
    </div>
  )
}
