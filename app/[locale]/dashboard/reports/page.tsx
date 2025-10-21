import { getSession } from "@/lib/session"
import { getTransactionsCached } from "@/lib/cached"
import { IncomeExpenseChart } from "@/components/income-expense-chart"
import { CategoryBreakdownChart } from "@/components/category-breakdown-chart"
import { MonthlyTrendChart } from "@/components/monthly-trend-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExportReportForm } from "@/components/export-report-form"
import { decimalToNumber } from "@/lib/utils"
import { redirect } from "@/lib/navigation"

export default async function ReportsPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect("/auth/login")
  }

  const transactions = await getTransactionsCached(session.user.id)
  const txs = transactions.map((t) => ({
    ...t,
    amount: decimalToNumber(t.amount),
    date: new Date(t.date).toISOString().split("T")[0],
  }))

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
        <IncomeExpenseChart transactions={txs as any} />
        <CategoryBreakdownChart transactions={txs as any} />
        <MonthlyTrendChart transactions={txs as any} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Summary</CardTitle>
          <CardDescription>Overview of all your transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center">
            <p>Total Transactions: {txs.length}</p>
            <p className="text-sm">
              Date Range: {txs.length > 0 ? `${new Date(txs[txs.length - 1]!.date).toLocaleDateString()} - ${new Date(txs[0]!.date).toLocaleDateString()}` : "No data"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
