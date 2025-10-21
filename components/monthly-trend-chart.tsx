"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
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
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i)
    return { date: startOfMonth(date), label: format(date, "MMM yyyy") }
  })

  const data = months.map((month) => {
    const monthTransactions = transactions.filter((x) => {
      const d = new Date(x.date)
      return d.getMonth() === month.date.getMonth() && d.getFullYear() === month.date.getFullYear()
    })
    const income = monthTransactions.filter((x) => x.type === "income").reduce((s, x) => s + x.amount, 0)
    const expenses = monthTransactions.filter((x) => x.type === "expense").reduce((s, x) => s + x.amount, 0)
    return { month: month.label, income, expenses }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("sixMonthTrend")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(v) => formatCurrency(Number(v))} />
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            <Legend />
            <Area type="monotone" dataKey="income" name={t("income")} stroke="#10b981" fill="url(#incomeGradient)" strokeWidth={2} />
            <Area type="monotone" dataKey="expenses" name={t("expenses")} stroke="#ef4444" fill="url(#expensesGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
