import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decimalToNumber } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const type = searchParams.get("type") || "all"

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        ...(startDate && { date: { gte: new Date(startDate) } }),
        ...(endDate && { date: { lte: new Date(endDate) } }),
        ...(type !== "all" && { type: type as "income" | "expense" }),
      },
      include: {
        financialAccount: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    })

    // Simple PDF generation as text - in a real app you'd use a PDF library
    const pdfContent = `
Financial Report - ${new Date().toLocaleDateString()}
User: ${session.user.email}
Period: ${startDate || "All time"} - ${endDate || "Present"}
Filter: ${type}

Transactions:
${transactions
  .map(
    (t) =>
      `${t.date.toLocaleDateString()} | ${t.description} | ${t.type} | $${t.amount} | ${t.financialAccount?.name} | ${t.category?.name}`
  )
  .join("\n")}

Summary:
Total Transactions: ${transactions.length}
Total Income: $${transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + decimalToNumber(t.amount), 0)}
Total Expenses: $${transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + decimalToNumber(t.amount), 0)}
Net: $${transactions.reduce((sum, t) => sum + (t.type === "income" ? decimalToNumber(t.amount) : -decimalToNumber(t.amount)), 0)}
`

    return new NextResponse(pdfContent, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="financial-report-${new Date().toISOString().split("T")[0]}.txt"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
