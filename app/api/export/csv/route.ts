import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    const csvHeaders = ["Date", "Description", "Amount", "Type", "Account", "Category"]

    const csvRows = transactions.map((transaction) => [
      transaction.date.toISOString().split("T")[0],
      transaction.description,
      transaction.amount.toString(),
      transaction.type,
      transaction.financialAccount?.name || "",
      transaction.category?.name || "",
    ])

    const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="transactions-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
