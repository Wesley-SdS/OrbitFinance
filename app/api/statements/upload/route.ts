import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pdfExtractor } from "@/lib/ai/pdf-extractor"

const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Max size: 10MB" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Invalid file type. Only PDF is supported" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const extracted = await pdfExtractor.extractFromBuffer(buffer)

    return NextResponse.json({
      success: true,
      data: {
        bank: extracted.bank,
        period: extracted.period,
        transactions: extracted.transactions.map((t) => ({
          date: t.date,
          description: t.description,
          amount: Math.abs(t.amount),
          type: t.type,
          suggestedCategory: t.suggestedCategory,
        })),
        totalTransactions: extracted.transactions.length,
        totalIncome: extracted.transactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Math.abs(t.amount), 0),
        totalExpense: extracted.transactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      },
    })
  } catch (error) {
    console.error("PDF extraction error:", error)
    return NextResponse.json(
      {
        error: "Failed to extract transactions from PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
