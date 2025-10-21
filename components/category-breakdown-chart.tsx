"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { formatCurrency } from "@/lib/utils"

type Transaction = {
  type: string
  amount: number
  category: {
    name: string
    color: string
  }
}

export function CategoryBreakdownChart({ transactions }: { transactions: Transaction[] }) {
  const t = useTranslations("dashboard")
  // Group expenses by category
  const expensesByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => {
        const categoryName = t.category.name
        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            value: 0,
            color: t.category.color,
          }
        }
        acc[categoryName].value += t.amount
        return acc
      },
      {} as Record<string, { name: string; value: number; color: string }>
    )

  const data = Object.values(expensesByCategory).sort((a, b) => b.value - a.value)

  const tCommon = useTranslations("common")

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("expensesByCategory")}</CardTitle>
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
        <CardTitle>{t("expensesByCategory")}</CardTitle>
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
