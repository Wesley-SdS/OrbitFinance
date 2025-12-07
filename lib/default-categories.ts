import { prisma } from "@/lib/prisma"
import { CategoryType } from "@prisma/client"

interface CategoryTemplate {
  name: string
  icon: string
  color: string
}

const incomeCategories: CategoryTemplate[] = [
  { name: "Salary", icon: "💼", color: "#10b981" },
  { name: "Freelance", icon: "💻", color: "#3b82f6" },
  { name: "Investment", icon: "📈", color: "#8b5cf6" },
  { name: "Side Hustle", icon: "🚀", color: "#f59e0b" },
  { name: "Gift", icon: "🎁", color: "#ef4444" },
  { name: "Other Income", icon: "💰", color: "#6b7280" },
]

const expenseCategories: CategoryTemplate[] = [
  { name: "Food & Dining", icon: "🍽️", color: "#ef4444" },
  { name: "Transportation", icon: "🚗", color: "#3b82f6" },
  { name: "Shopping", icon: "🛍️", color: "#8b5cf6" },
  { name: "Entertainment", icon: "🎬", color: "#f59e0b" },
  { name: "Bills & Utilities", icon: "⚡", color: "#6b7280" },
  { name: "Healthcare", icon: "🏥", color: "#10b981" },
  { name: "Education", icon: "📚", color: "#06b6d4" },
  { name: "Travel", icon: "✈️", color: "#84cc16" },
  { name: "Insurance", icon: "🛡️", color: "#f97316" },
  { name: "Subscriptions", icon: "📱", color: "#ec4899" },
  { name: "Home & Garden", icon: "🏠", color: "#14b8a6" },
  { name: "Personal Care", icon: "💅", color: "#a855f7" },
  { name: "Gifts & Donations", icon: "🎁", color: "#ef4444" },
  { name: "Other Expenses", icon: "💸", color: "#6b7280" },
]

export async function createDefaultCategoriesForUser(
  userId: string
): Promise<void> {
  const categories = [
    ...incomeCategories.map((cat) => ({
      userId,
      name: cat.name,
      type: "income" as CategoryType,
      color: cat.color,
      icon: cat.icon,
      isSystem: true,
    })),
    ...expenseCategories.map((cat) => ({
      userId,
      name: cat.name,
      type: "expense" as CategoryType,
      color: cat.color,
      icon: cat.icon,
      isSystem: true,
    })),
  ]

  await prisma.category.createMany({
    data: categories,
    skipDuplicates: true,
  })
}
