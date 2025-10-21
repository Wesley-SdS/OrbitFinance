"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { format, startOfMonth, subMonths } from "date-fns"
import { useTranslations } from "next-intl"
import { formatCurrency } from "@/lib/utils"

type Transaction = {
  type: string
  amount: number
  date: string
}

export function MonthlyTrendChart({ transactions }: { transactions: Transaction[] }) {
  const t = useTranslations("dashboard")
  // Get last 6 months
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i)
    return {
      date: startOfMonth(date),
      label: format(date, "MMM yyyy"),
    }
  })

  const data = months.map((month) => {
    const monthTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date)
      return tDate.getMonth() === month.date.getMonth() && tDate.getFullYear() === month.date.getFullYear()
    })

    const income = monthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
    const expenses = monthTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    return {
      month: month.label,
      income,
      expenses,
    }
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("sixMonthTrend")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => formatCurrency(Number(value))} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="income" name={t("income")} fill="#10b981" />
            <Bar dataKey="expenses" name={t("expenses")} fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
