"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { formatCurrency } from "@/lib/utils"

type Transaction = {
  type: string
  amount: number
}

export function IncomeExpenseChart({ transactions }: { transactions: Transaction[] }) {
  const t = useTranslations("dashboard")
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  const data = [
    { name: t("income"), value: totalIncome, color: "#10b981" },
    { name: t("expenses"), value: totalExpense, color: "#ef4444" },
  ]

  const tCommon = useTranslations("common")

  if (totalIncome === 0 && totalExpense === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("incomeVsExpenses")}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">{tCommon("noData")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("incomeVsExpenses")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
