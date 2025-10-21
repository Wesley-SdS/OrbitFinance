#!/usr/bin/env node

/**
 * OrbiFinance Database Reset Script
 * Drops and recreates the database (BE CAREFUL!)
 */

const { Client } = require("pg")
const { runMigrations } = require("./migrate")
const { seedDatabase } = require("./seed")

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "orbifinance_dev",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
}

async function resetDatabase() {
  const client = new Client(DB_CONFIG)

  try {
    await client.connect()
    console.log("📊 Connected to database")

    // Show warning
    console.log("⚠️  WARNING: This will delete ALL data in the database!")
    console.log("🗄️  Database:", DB_CONFIG.database)

    // In production, you might want to add a confirmation prompt here
    if (process.env.NODE_ENV === "production") {
      console.error("❌ Cannot reset production database!")
      process.exit(1)
    }

    console.log("🔄 Dropping all tables...")

    // Drop all tables in correct order (respecting foreign key constraints)
    const dropTables = [
      "DROP TABLE IF EXISTS ai_insights CASCADE",
      "DROP TABLE IF EXISTS goals CASCADE",
      "DROP TABLE IF EXISTS transactions CASCADE",
      "DROP TABLE IF EXISTS categories CASCADE",
      "DROP TABLE IF EXISTS accounts CASCADE",
      "DROP TABLE IF EXISTS profiles CASCADE",
      "DROP TABLE IF EXISTS migrations CASCADE",
    ]

    for (const query of dropTables) {
      await client.query(query)
    }

    console.log("✅ All tables dropped")

    // Drop functions and triggers
    console.log("🔄 Dropping functions and triggers...")
    await client.query("DROP FUNCTION IF EXISTS update_goal_progress() CASCADE")
    await client.query("DROP FUNCTION IF EXISTS recalculate_user_goals(UUID) CASCADE")
    await client.query("DROP FUNCTION IF EXISTS update_specific_goal_progress(UUID) CASCADE")

    console.log("✅ Functions and triggers dropped")
  } catch (error) {
    console.error("❌ Reset failed:", error.message)
    process.exit(1)
  } finally {
    await client.end()
  }

  // Run migrations to recreate schema
  console.log("🔄 Running migrations to recreate schema...")
  await runMigrations()

  // Seed with default data
  console.log("🌱 Seeding with default data...")
  await seedDatabase()

  console.log("🎉 Database reset completed successfully!")
}

// Run reset if called directly
if (require.main === module) {
  resetDatabase()
}

module.exports = { resetDatabase }
