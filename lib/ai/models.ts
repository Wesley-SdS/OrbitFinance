import { GoogleGenerativeAI } from "@google/generative-ai"
import { generateText } from "ai"

// ===============================
// AI Model Configuration
// ===============================

/**
 * OrbiFinance AI Strategy:
 *
 * PRIMARY: Gemini 1.5 Flash (Google)
 * - Faster and cheaper for most financial analysis
 * - Good for insights, spending patterns, basic recommendations
 * - Use for: 80% of AI operations
 *
 * SECONDARY: GPT-4o-mini (OpenAI)
 * - Use only for complex analysis requiring higher reasoning
 * - Use for: Complex financial planning, detailed reports
 * - Fallback when Gemini fails
 */

interface AIResponse {
  insights: Array<{
    type: "spending_pattern" | "saving_tip" | "budget_alert" | "goal_progress" | "general"
    title: string
    content: string
    priority: "low" | "medium" | "high"
  }>
}

// ===============================
// Gemini 1.5 Flash (Primary)
// ===============================

const geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

export async function generateInsightsWithGemini(
  transactions: any[],
  goals: any[],
  preferences?: { language?: string }
): Promise<AIResponse> {
  try {
    const model = geminiClient.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Calculate financial metrics
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    // Group expenses by category
    const expensesByCategory = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        const categoryName = t.category?.name || "Other"
        acc[categoryName] = (acc[categoryName] || 0) + t.amount
        return acc
      }, {})

    const topCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([name]) => name)

    const prompt = `You are OrbiFinance AI, a financial advisor. Analyze this data and provide 3-4 actionable insights in ${preferences?.language || "English"}.

Financial Summary:
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpense.toFixed(2)}
- Net: $${(totalIncome - totalExpense).toFixed(2)}
- Top spending categories: ${topCategories.join(", ")}
- Active goals: ${goals.length}

${goals.length > 0 ? `Goals:\n${goals.map((g) => `- ${g.name}: $${g.current_amount}/$${g.target_amount}`).join("\n")}` : ""}

Return ONLY a JSON array with this exact format:
[
  {
    "type": "spending_pattern",
    "title": "Brief title (max 60 chars)",
    "content": "Detailed insight (max 200 chars)",
    "priority": "medium"
  }
]

Focus on:
1. Spending patterns and trends
2. Savings opportunities
3. Goal progress
4. Budget optimization

Return ONLY the JSON array, no markdown or extra text.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Try to parse JSON response
    try {
      const insights = JSON.parse(text)
      return { insights }
    } catch (parseError) {
      console.warn("Gemini response parsing failed, using fallback")
      return { insights: getFallbackInsights(totalIncome, totalExpense, topCategories, goals) }
    }
  } catch (error) {
    console.error("Gemini AI failed, falling back to GPT-4o-mini:", error)
    return generateInsightsWithOpenAI(transactions, goals, preferences)
  }
}

// ===============================
// GPT-4o-mini (Secondary/Fallback)
// ===============================

export async function generateInsightsWithOpenAI(
  transactions: any[],
  goals: any[],
  preferences?: { language?: string }
): Promise<AIResponse> {
  try {
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    const expensesByCategory = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        const categoryName = t.category?.name || "Other"
        acc[categoryName] = (acc[categoryName] || 0) + t.amount
        return acc
      }, {})

    const topCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([name]) => name)

    const prompt = `You are OrbiFinance AI. Analyze financial data and provide 3-4 specific insights in ${preferences?.language || "English"}.

Financial Data:
- Income: $${totalIncome.toFixed(2)}
- Expenses: $${totalExpense.toFixed(2)}
- Net: $${(totalIncome - totalExpense).toFixed(2)}
- Top categories: ${topCategories.join(", ")}
- Goals: ${goals.length}

${goals.length > 0 ? `Goals:\n${goals.map((g) => `- ${g.name}: $${g.current_amount}/$${g.target_amount}`).join("\n")}` : ""}

Return JSON array:
[
  {
    "type": "spending_pattern" | "saving_tip" | "budget_alert" | "goal_progress" | "general",
    "title": "Title (max 60 chars)",
    "content": "Content (max 200 chars)",
    "priority": "low" | "medium" | "high"
  }
]

Focus on actionable financial advice. Return ONLY JSON.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
    })

    try {
      const insights = JSON.parse(text)
      return { insights }
    } catch (parseError) {
      console.warn("OpenAI response parsing failed, using fallback")
      return { insights: getFallbackInsights(totalIncome, totalExpense, topCategories, goals) }
    }
  } catch (error) {
    console.error("OpenAI AI failed, using static fallback:", error)
    const totalIncome = 0
    const totalExpense = 0
    const topCategories: string[] = []
    return { insights: getFallbackInsights(totalIncome, totalExpense, topCategories, goals) }
  }
}

// ===============================
// Smart AI Router
// ===============================

export async function generateFinancialInsights(
  transactions: any[],
  goals?: any[],
  options?: {
    language?: string
    useComplex?: boolean
  }
): Promise<{ insights: any[] }> {
  try {
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0)

    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0)

    const expensesByCategory = transactions
      .filter((t) => t.type === "expense")
      .reduce(
        (acc, t) => {
          const categoryName = t.category?.name || "Other"
          acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount)
          return acc
        },
        {} as Record<string, number>
      )

    const topCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([name]) => name)

    return { insights: getFallbackInsights(totalIncome, totalExpense, topCategories, goals || []) }
  } catch (error) {
    console.error("Failed to generate insights:", error)
    return { insights: getFallbackInsights(0, 0, [], goals || []) }
  }
}

// ===============================
// Fallback Static Insights
// ===============================

function getFallbackInsights(totalIncome: number, totalExpense: number, topCategories: string[], goals: any[]): any[] {
  const insights = [
    {
      type: "spending_pattern",
      title: "Review Your Spending",
      content: `Your top spending category is ${topCategories[0] || "miscellaneous"}. Consider setting a budget to track this expense.`,
      priority: "medium" as const,
    },
    {
      type: "saving_tip",
      title: "Build Emergency Fund",
      content: "Aim to save 3-6 months of expenses for financial security. Start with small, consistent contributions.",
      priority: "high" as const,
    },
  ]

  if (totalIncome > totalExpense) {
    insights.push({
      type: "saving_tip",
      title: "Positive Cash Flow",
      content: `You have $${(totalIncome - totalExpense).toFixed(2)} excess this period. Consider increasing savings or investments.`,
      priority: "medium" as const,
    })
  } else if (totalExpense > totalIncome) {
    insights.push({
      type: "spending_pattern",
      title: "Spending Alert",
      content: `You're spending $${(totalExpense - totalIncome).toFixed(2)} more than you earn. Review and reduce expenses.`,
      priority: "high" as const,
    })
  }

  if (goals.length > 0) {
    const activeGoals = goals.filter((g) => !g.isCompleted)
    if (activeGoals.length > 0) {
      insights.push({
        type: "saving_tip",
        title: "Goal Progress",
        content: `You have ${activeGoals.length} active goal(s). Consider automating transfers to reach them faster.`,
        priority: "medium" as const,
      })
    }
  }

  return insights
}

// ===============================
// Utility Functions
// ===============================

export function getAIModelStatus() {
  return {
    gemini: {
      available: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      model: "gemini-1.5-flash",
      primary: true,
    },
    openai: {
      available: !!process.env.OPENAI_API_KEY,
      model: "gpt-4o-mini",
      fallback: true,
    },
  }
}

export function shouldUseComplexAnalysis(transactions: any[], goals: any[]): boolean {
  // Use complex model for:
  // - Large datasets (>100 transactions)
  // - Multiple goals (>3)
  // - Complex financial situations

  return transactions.length > 100 || goals.length > 3 || (transactions.length > 50 && goals.length > 1)
}
