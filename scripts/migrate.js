#!/usr/bin/env node

/**
 * OrbiFinance Database Migration Script
 * Executes SQL migration files in order
 */

const { Client } = require("pg")
const fs = require("fs")
const path = require("path")

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "orbifinance_dev",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
}

async function runMigrations() {
  const client = new Client(DB_CONFIG)

  try {
    await client.connect()
    console.log("📊 Connected to database")

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Get list of executed migrations
    const { rows: executedMigrations } = await client.query("SELECT filename FROM migrations ORDER BY id")
    const executedFiles = executedMigrations.map((row) => row.filename)

    // Get all migration files
    const scriptsDir = path.join(__dirname)
    const migrationFiles = fs
      .readdirSync(scriptsDir)
      .filter((file) => file.endsWith(".sql") && file.match(/^\d{3}_/))
      .sort()

    console.log(`📝 Found ${migrationFiles.length} migration files`)

    // Execute new migrations
    for (const filename of migrationFiles) {
      if (executedFiles.includes(filename)) {
        console.log(`⏭️  Skipping ${filename} (already executed)`)
        continue
      }

      console.log(`🔄 Executing ${filename}...`)

      const filePath = path.join(scriptsDir, filename)
      const sql = fs.readFileSync(filePath, "utf8")

      try {
        await client.query("BEGIN")
        await client.query(sql)
        await client.query("INSERT INTO migrations (filename) VALUES ($1)", [filename])
        await client.query("COMMIT")
        console.log(`✅ Successfully executed ${filename}`)
      } catch (error) {
        await client.query("ROLLBACK")
        throw new Error(`Failed to execute ${filename}: ${error.message}`)
      }
    }

    console.log("🎉 All migrations completed successfully!")
  } catch (error) {
    console.error("❌ Migration failed:", error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
}

module.exports = { runMigrations }
