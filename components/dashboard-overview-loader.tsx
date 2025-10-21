"use client"

import { useEffect, useState } from "react"
import { IncomeExpenseChart } from "@/components/income-expense-chart"
import { CategoryBreakdownChart } from "@/components/category-breakdown-chart"
import { MonthlyTrendChart } from "@/components/monthly-trend-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, decimalToNumber } from "@/lib/utils"
import { useTranslations } from "next-intl"

type Tx = { id: string; type: string; amount: any; date: string | Date; description: string; category?: any; financialAccount?: any }
type Account = { id: string; name: string; balance: any; type: string }
type Goal = { id: string }

export function DashboardOverviewLoader() {
  const [transactions, setTransactions] = useState<Tx[] | null>(null)
  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [goals, setGoals] = useState<Goal[] | null>(null)
  const t = useTranslations()

  useEffect(() => {
    const load = async () => {
      try {
        const [txRes, accRes, goalRes] = await Promise.all([
          fetch("/api/transactions", { cache: "no-store" }),
          fetch("/api/accounts", { cache: "no-store" }),
          fetch("/api/goals", { cache: "no-store" }),
        ])
        const [txJson, accJson, goalJson] = await Promise.all([
          txRes.ok ? txRes.json() : { transactions: [] },
          accRes.ok ? accRes.json() : { accounts: [] },
          goalRes.ok ? goalRes.json() : { goals: [] },
        ])
        setTransactions(txJson.transactions || [])
        setAccounts(accJson.accounts || [])
        setGoals(goalJson.goals || [])
      } catch {
        setTransactions([])
        setAccounts([])
        setGoals([])
      }
    }
    load()
  }, [])

  if (!transactions || !accounts || !goals) return <div className="p-4 text-center">Loading...</div>

  const txs = transactions
    .map((t) => ({
      ...t,
      amount: decimalToNumber(t.amount),
      date: typeof t.date === "string" ? t.date : new Date(t.date).toISOString().split("T")[0],
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const recent = txs.slice(0, 5)
  const totalBalance = (accounts as any[]).reduce((sum, a) => sum + decimalToNumber(a.balance), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container max-w-7xl p-6 lg:p-8">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gradient mb-2">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground text-lg">{t("dashboard.welcome")}! {t("dashboard.overview")}</p>
        </div>

        <div className="mb-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.totalBalance")}</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-primary"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gradient">{formatCurrency(totalBalance)}</div>
              <p className="text-muted-foreground text-sm mt-1">{t("dashboard.accountsCount", { count: accounts.length })}</p>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.activeGoals")}</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-chart-2/20 to-chart-2/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-chart-2"><path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-2">{goals.length}</div>
              <p className="text-muted-foreground text-sm mt-1">{t("dashboard.financialObjectives")}</p>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.recentTransactions")}</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-chart-3/20 to-chart-3/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-chart-3"><path d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-3">{recent.length}</div>
              <p className="text-muted-foreground text-sm mt-1">{t("dashboard.last30Days")}</p>
            </CardContent>
          </Card>

          <Card className="hover-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("accounts.title")}</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-chart-4/20 to-chart-4/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-chart-4"><path d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-4">{accounts.length}</div>
              <p className="text-muted-foreground text-sm mt-1">{t("dashboard.connectedAccounts")}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <IncomeExpenseChart transactions={txs as any} />
          <CategoryBreakdownChart transactions={txs as any} />
          <MonthlyTrendChart transactions={txs as any} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t("dashboard.recentTransactions")}</CardTitle>
            <CardDescription className="text-base">{t("transactions.yourLatestActivity")}</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-8 w-8 text-muted-foreground"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
                </div>
                <p className="text-muted-foreground text-lg font-medium mb-1">{t("transactions.noTransactions")}</p>
                <p className="text-muted-foreground text-sm">{t("transactions.startAdding")}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {recent.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 rounded-xl glass hover-glow transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-lg">
                        {transaction.category?.icon || "💰"}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{transaction.description}</p>
                        <p className="text-muted-foreground text-sm">
                          {transaction.financialAccount?.name} • {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`font-bold text-lg ${transaction.type === "income" ? "text-chart-2" : "text-destructive"}`}>
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(decimalToNumber(transaction.amount))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

