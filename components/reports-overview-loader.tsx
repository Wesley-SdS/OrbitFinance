"use client"

import { useEffect, useState } from "react"
import { IncomeExpenseChart } from "@/components/income-expense-chart"
import { CategoryBreakdownChart } from "@/components/category-breakdown-chart"
import { MonthlyTrendChart } from "@/components/monthly-trend-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { decimalToNumber } from "@/lib/utils"
import { ExportReportForm } from "@/components/export-report-form"

type Tx = {
  id: string
  type: "income" | "expense" | string
  amount: any
  date: string | Date
  category: { name: string; type?: string; color: string; icon?: string }
  financialAccount: { name: string }
}

export function ReportsOverviewLoader() {
  const [transactions, setTransactions] = useState<Tx[] | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/transactions", { cache: "no-store" })
        if (!res.ok) return setTransactions([])
        const json = await res.json()
        setTransactions(json.transactions as Tx[])
      } catch {
        setTransactions([])
      }
    }
    load()
  }, [])

  if (!transactions) return <div className="p-4 text-center">Loading...</div>

  const txs = transactions.map((t) => ({
    ...t,
    amount: decimalToNumber(t.amount),
    date: typeof t.date === "string" ? t.date : new Date(t.date).toISOString().split("T")[0],
  }))

  const totalIncome = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const totalExpense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const net = txs.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0)

  return (
    <>
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
        <IncomeExpenseChart transactions={txs} />
        <CategoryBreakdownChart transactions={txs as any} />
        <MonthlyTrendChart transactions={txs as any} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Summary</CardTitle>
          <CardDescription>Overview of all your transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalIncome.toLocaleString()}</div>
              <p className="text-muted-foreground text-sm">Total Income</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totalExpense.toLocaleString()}</div>
              <p className="text-muted-foreground text-sm">Total Expenses</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{net.toLocaleString()}</div>
              <p className="text-muted-foreground text-sm">Net Balance</p>
            </div>
          </div>

          <div className="text-muted-foreground text-center">
            <p>Total Transactions: {txs.length}</p>
            <p className="text-sm">
              Date Range: {txs.length > 0 ? `${new Date(txs[txs.length - 1]!.date).toLocaleDateString()} - ${new Date(txs[0]!.date).toLocaleDateString()}` : "No data"}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
