import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { ExportReportForm } from "@/components/export-report-form"
import { IncomeExpenseChart } from "@/components/income-expense-chart"
import { CategoryBreakdownChart } from "@/components/category-breakdown-chart"
import { MonthlyTrendChart } from "@/components/monthly-trend-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from "@/lib/navigation"
import { decimalToNumber } from "@/lib/utils"

export default async function ReportsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/auth/login")
  }

  // Get transactions for reports
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      financialAccount: {
        select: {
          name: true,
        },
      },
      category: {
        select: {
          name: true,
          type: true,
          color: true,
          icon: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  })

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground">Analyze your financial data and export reports</p>
      </div>

      <div className="mb-8 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Export Reports</CardTitle>
            <CardDescription>Download your financial data in various formats</CardDescription>
          </CardHeader>
          <CardContent>
            <ExportReportForm format="csv" />
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <IncomeExpenseChart
          transactions={transactions.map((t) => ({
            ...t,
            amount: decimalToNumber(t.amount),
            date: t.date.toISOString().split("T")[0],
          }))}
        />
        <CategoryBreakdownChart
          transactions={transactions.map((t) => ({
            ...t,
            amount: decimalToNumber(t.amount),
            date: t.date.toISOString().split("T")[0],
          }))}
        />
        <MonthlyTrendChart
          transactions={transactions.map((t) => ({
            ...t,
            amount: decimalToNumber(t.amount),
            date: t.date.toISOString().split("T")[0],
          }))}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Summary</CardTitle>
          <CardDescription>Overview of all your transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {transactions
                  .filter((t) => t.type === "income")
                  .reduce((sum, t) => sum + decimalToNumber(t.amount), 0)
                  .toLocaleString()}
              </div>
              <p className="text-muted-foreground text-sm">Total Income</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {transactions
                  .filter((t) => t.type === "expense")
                  .reduce((sum, t) => sum + decimalToNumber(t.amount), 0)
                  .toLocaleString()}
              </div>
              <p className="text-muted-foreground text-sm">Total Expenses</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {transactions
                  .reduce(
                    (sum, t) => sum + (t.type === "income" ? decimalToNumber(t.amount) : -decimalToNumber(t.amount)),
                    0
                  )
                  .toLocaleString()}
              </div>
              <p className="text-muted-foreground text-sm">Net Balance</p>
            </div>
          </div>

          <div className="text-muted-foreground text-center">
            <p>Total Transactions: {transactions.length}</p>
            <p className="text-sm">
              Date Range:{" "}
              {transactions.length > 0
                ? `${new Date(transactions[transactions.length - 1]!.date).toLocaleDateString()} - ${new Date(transactions[0]!.date).toLocaleDateString()}`
                : "No data"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
