import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create system profile first
  const systemUserId = "system_user_profile"

  await prisma.user.upsert({
    where: { id: systemUserId },
    update: {},
    create: {
      id: systemUserId,
      name: "System",
      email: "system@orbifinance.local",
    },
  })
  console.log("✅ Created system profile")

  // Income categories
  const incomeCategories = [
    { name: "Salary", icon: "💼", color: "#10b981" },
    { name: "Freelance", icon: "💻", color: "#3b82f6" },
    { name: "Investment", icon: "📈", color: "#8b5cf6" },
    { name: "Side Hustle", icon: "🚀", color: "#f59e0b" },
    { name: "Gift", icon: "🎁", color: "#ef4444" },
    { name: "Other Income", icon: "💰", color: "#6b7280" },
  ]

  // Expense categories
  const expenseCategories = [
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

  // Create income categories
  for (const category of incomeCategories) {
    await prisma.category.upsert({
      where: {
        userId_name_type: {
          userId: systemUserId,
          name: category.name,
          type: "income",
        },
      },
      update: {},
      create: {
        userId: systemUserId,
        name: category.name,
        type: "income",
        color: category.color,
        icon: category.icon,
        isSystem: true,
      },
    })
    console.log(`✅ Created income category: ${category.name}`)
  }

  // Create expense categories
  for (const category of expenseCategories) {
    await prisma.category.upsert({
      where: {
        userId_name_type: {
          userId: systemUserId,
          name: category.name,
          type: "expense",
        },
      },
      update: {},
      create: {
        userId: systemUserId,
        name: category.name,
        type: "expense",
        color: category.color,
        icon: category.icon,
        isSystem: true,
      },
    })
    console.log(`✅ Created expense category: ${category.name}`)
  }

  console.log("🎉 Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })