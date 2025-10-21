#!/usr/bin/env node

/**
 * OrbiFinance Database Seeding Script
 * Seeds the database with default categories and sample data
 */

const { Client } = require("pg")

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "orbifinance_dev",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
}

// Default categories to seed
const DEFAULT_CATEGORIES = {
  income: [
    { name: "Salary", icon: "💼", color: "#10b981" },
    { name: "Freelance", icon: "💻", color: "#3b82f6" },
    { name: "Investment", icon: "📈", color: "#8b5cf6" },
    { name: "Side Hustle", icon: "🚀", color: "#f59e0b" },
    { name: "Gift", icon: "🎁", color: "#ef4444" },
    { name: "Other Income", icon: "💰", color: "#6b7280" },
  ],
  expense: [
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
  ],
}

async function seedDatabase() {
  const client = new Client(DB_CONFIG)

  try {
    await client.connect()
    console.log("📊 Connected to database")

    // Check if categories already exist
    const { rows: existingCategories } = await client.query(
      "SELECT COUNT(*) as count FROM categories WHERE is_system = true"
    )

    if (parseInt(existingCategories[0].count) > 0) {
      console.log("⏭️  System categories already exist, skipping...")
      return
    }

    console.log("🌱 Seeding default categories...")

    // Create a system user for default categories
    const systemUserId = "00000000-0000-0000-0000-000000000000"

    // Seed income categories
    for (const category of DEFAULT_CATEGORIES.income) {
      await client.query(
        `
        INSERT INTO categories (id, user_id, name, type, color, icon, is_system)
        VALUES (gen_random_uuid(), $1, $2, 'income', $3, $4, true)
        ON CONFLICT (user_id, name, type) DO NOTHING
      `,
        [systemUserId, category.name, category.color, category.icon]
      )

      console.log(`✅ Added income category: ${category.name}`)
    }

    // Seed expense categories
    for (const category of DEFAULT_CATEGORIES.expense) {
      await client.query(
        `
        INSERT INTO categories (id, user_id, name, type, color, icon, is_system)
        VALUES (gen_random_uuid(), $1, $2, 'expense', $3, $4, true)
        ON CONFLICT (user_id, name, type) DO NOTHING
      `,
        [systemUserId, category.name, category.color, category.icon]
      )

      console.log(`✅ Added expense category: ${category.name}`)
    }

    console.log("🎉 Database seeded successfully!")

    // Show summary
    const { rows: summary } = await client.query(`
      SELECT
        type,
        COUNT(*) as count
      FROM categories
      WHERE is_system = true
      GROUP BY type
    `)

    console.log("\n📈 Seeding Summary:")
    summary.forEach((row) => {
      console.log(`   ${row.type}: ${row.count} categories`)
    })
  } catch (error) {
    console.error("❌ Seeding failed:", error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Function to create sample user data (for development)
async function seedSampleData(userId) {
  const client = new Client(DB_CONFIG)

  try {
    await client.connect()
    console.log("🧪 Creating sample data for development...")

    // Create sample accounts
    const accounts = [
      { name: "Main Checking", type: "checking", balance: 2500.0, icon: "🏦", color: "#3b82f6" },
      { name: "Savings Account", type: "savings", balance: 15000.0, icon: "💰", color: "#10b981" },
      { name: "Credit Card", type: "credit_card", balance: -850.0, icon: "💳", color: "#ef4444" },
    ]

    for (const account of accounts) {
      await client.query(
        `
        INSERT INTO accounts (id, user_id, name, type, balance, icon, color)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
      `,
        [userId, account.name, account.type, account.balance, account.icon, account.color]
      )
    }

    // Create sample goals
    const goals = [
      {
        name: "Emergency Fund",
        target_amount: 10000.0,
        current_amount: 3500.0,
        category: "savings",
        icon: "🚨",
        color: "#ef4444",
      },
      {
        name: "Vacation",
        target_amount: 5000.0,
        current_amount: 1200.0,
        category: "travel",
        icon: "✈️",
        color: "#3b82f6",
      },
      {
        name: "New Car",
        target_amount: 25000.0,
        current_amount: 5000.0,
        category: "transportation",
        icon: "🚗",
        color: "#10b981",
      },
    ]

    for (const goal of goals) {
      await client.query(
        `
        INSERT INTO goals (id, user_id, name, target_amount, current_amount, category, icon, color)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
      `,
        [userId, goal.name, goal.target_amount, goal.current_amount, goal.category, goal.icon, goal.color]
      )
    }

    console.log("✅ Sample data created!")
  } catch (error) {
    console.error("❌ Sample data creation failed:", error.message)
  } finally {
    await client.end()
  }
}

// Run seeding if called directly
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.includes("--sample") && args.includes("--user-id")) {
    const userIdIndex = args.indexOf("--user-id")
    const userId = args[userIdIndex + 1]
    if (userId) {
      seedSampleData(userId)
    } else {
      console.error("❌ Please provide a user ID with --user-id")
      process.exit(1)
    }
  } else {
    seedDatabase()
  }
}

module.exports = { seedDatabase, seedSampleData }
