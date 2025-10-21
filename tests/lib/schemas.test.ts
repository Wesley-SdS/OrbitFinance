import { describe, it, expect } from "vitest"
import {
  CreateTransactionSchema,
  CreateAccountSchema,
  CreateCategorySchema,
  CreateGoalSchema,
  TransactionFiltersSchema,
} from "@/lib/schemas"

describe("Validation Schemas", () => {
  describe("CreateTransactionSchema", () => {
    it("should validate a correct transaction", () => {
      const validTransaction = {
        type: "expense" as const,
        amount: 100.5,
        description: "Grocery shopping",
        date: "2024-01-15",
        account_id: "123e4567-e89b-12d3-a456-426614174000",
        category_id: "123e4567-e89b-12d3-a456-426614174001",
      }

      const result = CreateTransactionSchema.safeParse(validTransaction)
      expect(result.success).toBe(true)
    })

    it("should reject negative amounts", () => {
      const invalidTransaction = {
        type: "expense" as const,
        amount: -50,
        description: "Invalid transaction",
        date: "2024-01-15",
        account_id: "123e4567-e89b-12d3-a456-426614174000",
        category_id: "123e4567-e89b-12d3-a456-426614174001",
      }

      const result = CreateTransactionSchema.safeParse(invalidTransaction)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("positive")
      }
    })

    it("should reject invalid UUIDs", () => {
      const invalidTransaction = {
        type: "expense" as const,
        amount: 100,
        description: "Test",
        date: "2024-01-15",
        account_id: "invalid-uuid",
        category_id: "123e4567-e89b-12d3-a456-426614174001",
      }

      const result = CreateTransactionSchema.safeParse(invalidTransaction)
      expect(result.success).toBe(false)
    })
  })

  describe("CreateAccountSchema", () => {
    it("should validate a correct account", () => {
      const validAccount = {
        name: "Main Checking",
        type: "checking" as const,
        balance: 1000,
        currency: "USD" as const,
        color: "#3b82f6",
        icon: "🏦",
      }

      const result = CreateAccountSchema.safeParse(validAccount)
      expect(result.success).toBe(true)
    })

    it("should apply default values", () => {
      const minimalAccount = {
        name: "Test Account",
        type: "checking" as const,
        icon: "💰",
      }

      const result = CreateAccountSchema.safeParse(minimalAccount)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.balance).toBe(0)
        expect(result.data.currency).toBe("USD")
        expect(result.data.color).toBe("#3b82f6")
      }
    })

    it("should reject invalid color format", () => {
      const invalidAccount = {
        name: "Test Account",
        type: "checking" as const,
        color: "red", // Invalid hex color
        icon: "💰",
      }

      const result = CreateAccountSchema.safeParse(invalidAccount)
      expect(result.success).toBe(false)
    })
  })

  describe("CreateCategorySchema", () => {
    it("should validate income category", () => {
      const validCategory = {
        name: "Salary",
        type: "income" as const,
        color: "#10b981",
        icon: "💼",
      }

      const result = CreateCategorySchema.safeParse(validCategory)
      expect(result.success).toBe(true)
    })

    it("should validate expense category", () => {
      const validCategory = {
        name: "Food",
        type: "expense" as const,
        color: "#ef4444",
        icon: "🍽️",
      }

      const result = CreateCategorySchema.safeParse(validCategory)
      expect(result.success).toBe(true)
    })

    it("should reject invalid category type", () => {
      const invalidCategory = {
        name: "Test",
        type: "invalid" as any,
        color: "#ef4444",
        icon: "📝",
      }

      const result = CreateCategorySchema.safeParse(invalidCategory)
      expect(result.success).toBe(false)
    })
  })

  describe("CreateGoalSchema", () => {
    it("should validate a correct goal", () => {
      const validGoal = {
        name: "Emergency Fund",
        target_amount: 10000,
        current_amount: 2500,
        deadline: "2024-12-31T23:59:59Z",
        category: "savings",
        color: "#10b981",
        icon: "🎯",
      }

      const result = CreateGoalSchema.safeParse(validGoal)
      expect(result.success).toBe(true)
    })

    it("should apply default values", () => {
      const minimalGoal = {
        name: "Test Goal",
        target_amount: 5000,
      }

      const result = CreateGoalSchema.safeParse(minimalGoal)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.current_amount).toBe(0)
        expect(result.data.category).toBe("savings")
        expect(result.data.color).toBe("#10b981")
        expect(result.data.icon).toBe("target")
      }
    })

    it("should reject negative amounts", () => {
      const invalidGoal = {
        name: "Test Goal",
        target_amount: -1000,
      }

      const result = CreateGoalSchema.safeParse(invalidGoal)
      expect(result.success).toBe(false)
    })
  })

  describe("TransactionFiltersSchema", () => {
    it("should validate empty filters", () => {
      const result = TransactionFiltersSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(20) // default
        expect(result.data.offset).toBe(0) // default
      }
    })

    it("should validate filters with all options", () => {
      const filters = {
        type: "expense" as const,
        account_id: "123e4567-e89b-12d3-a456-426614174000",
        category_id: "123e4567-e89b-12d3-a456-426614174001",
        start_date: "2024-01-01T00:00:00Z",
        end_date: "2024-01-31T23:59:59Z",
        limit: 50,
        offset: 10,
      }

      const result = TransactionFiltersSchema.safeParse(filters)
      expect(result.success).toBe(true)
    })

    it("should enforce maximum limit", () => {
      const filters = {
        limit: 200, // Over the max of 100
      }

      const result = TransactionFiltersSchema.safeParse(filters)
      expect(result.success).toBe(false)
    })
  })
})
