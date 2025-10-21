import { z } from "zod"

// ===============================
// Base Schemas
// ===============================

export const UUIDSchema = z.string().uuid("Invalid UUID format")

export const CurrencySchema = z.enum(["USD", "EUR", "BRL", "GBP", "JPY"])

export const ColorSchema = z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color format")

// ===============================
// Account Schemas
// ===============================

export const AccountTypeSchema = z.enum(["checking", "savings", "credit_card", "cash", "investment", "other"])

export const CreateAccountSchema = z.object({
  name: z.string().min(1, "Account name is required").max(50, "Account name too long"),
  type: AccountTypeSchema,
  balance: z.number().default(0),
  currency: CurrencySchema.default("USD"),
  color: ColorSchema.default("#3b82f6"),
  icon: z.string().min(1, "Icon is required").max(10, "Icon too long"),
})

export const UpdateAccountSchema = CreateAccountSchema.partial()

export type CreateAccountInput = z.infer<typeof CreateAccountSchema>
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>

// ===============================
// Category Schemas
// ===============================

export const CategoryTypeSchema = z.enum(["income", "expense"])

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(30, "Category name too long"),
  type: CategoryTypeSchema,
  color: ColorSchema.default("#6b7280"),
  icon: z.string().min(1, "Icon is required").max(10, "Icon too long"),
})

export const UpdateCategorySchema = CreateCategorySchema.partial()

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>

// ===============================
// Transaction Schemas
// ===============================

export const TransactionTypeSchema = z.enum(["income", "expense", "transfer"])

export const CreateTransactionSchema = z.object({
  type: TransactionTypeSchema,
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required").max(200, "Description too long"),
  date: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")),
  notes: z.string().max(500, "Notes too long").optional(),
  account_id: UUIDSchema,
  category_id: UUIDSchema,
})

export const UpdateTransactionSchema = CreateTransactionSchema.partial()

export const TransactionFiltersSchema = z.object({
  type: TransactionTypeSchema.optional(),
  account_id: UUIDSchema.optional(),
  category_id: UUIDSchema.optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  limit: z.number().positive().max(100).default(20),
  offset: z.number().min(0).default(0),
})

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>
export type TransactionFilters = z.infer<typeof TransactionFiltersSchema>

// ===============================
// Goal Schemas
// ===============================

export const CreateGoalSchema = z.object({
  name: z.string().min(1, "Goal name is required").max(50, "Goal name too long"),
  target_amount: z.number().positive("Target amount must be positive"),
  current_amount: z.number().min(0, "Current amount cannot be negative").default(0),
  deadline: z.string().datetime().optional(),
  category: z.string().max(30, "Category too long").default("savings"),
  color: ColorSchema.default("#10b981"),
  icon: z.string().min(1, "Icon is required").max(10, "Icon too long").default("target"),
})

export const UpdateGoalSchema = CreateGoalSchema.partial()

export const UpdateGoalProgressSchema = z.object({
  current_amount: z.number().min(0, "Current amount cannot be negative"),
})

export type CreateGoalInput = z.infer<typeof CreateGoalSchema>
export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>
export type UpdateGoalProgressInput = z.infer<typeof UpdateGoalProgressSchema>

// ===============================
// AI Insight Schemas
// ===============================

export const InsightTypeSchema = z.enum(["spending_pattern", "saving_tip", "budget_alert", "goal_progress", "general"])

export const InsightPrioritySchema = z.enum(["low", "medium", "high"])

export const CreateInsightSchema = z.object({
  insight_type: InsightTypeSchema,
  title: z.string().min(1, "Title is required").max(60, "Title too long"),
  content: z.string().min(1, "Content is required").max(200, "Content too long"),
  priority: InsightPrioritySchema.default("medium"),
})

export type CreateInsightInput = z.infer<typeof CreateInsightSchema>

// ===============================
// Export/Report Schemas
// ===============================

export const ExportFormatSchema = z.enum(["csv", "pdf"])

export const ExportRequestSchema = z.object({
  format: ExportFormatSchema,
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  transaction_type: TransactionTypeSchema.optional(),
  account_ids: z.array(UUIDSchema).optional(),
  category_ids: z.array(UUIDSchema).optional(),
})

export type ExportRequest = z.infer<typeof ExportRequestSchema>

// ===============================
// Profile Schemas
// ===============================

export const LanguageSchema = z.enum(["en", "pt", "es"])

export const UpdateProfileSchema = z.object({
  full_name: z.string().max(100, "Name too long").optional(),
  preferred_language: LanguageSchema.optional(),
  avatar_url: z.string().url("Invalid URL").optional(),
})

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
