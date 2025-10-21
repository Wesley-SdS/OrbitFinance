import { getSession } from "@/lib/session"
import { redirect } from "@/lib/navigation"
import { IncomeExpenseChart } from "@/components/income-expense-chart"
import { CategoryBreakdownChart } from "@/components/category-breakdown-chart"
import { MonthlyTrendChart } from "@/components/monthly-trend-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { decimalToNumber, formatCurrency } from "@/lib/utils"
import { getTransactionsCached, getAccountsCached, getGoalsCached } from "@/lib/cached"
import { getTranslations } from "next-intl/server"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user) {
    redirect("/auth/login")
  }
  const [recentTransactions, accounts, goals, t] = await Promise.all([
    getTransactionsCached(session.user.id, { limit: 5 }),
    getAccountsCached(session.user.id),
    getGoalsCached(session.user.id),
    getTranslations(),
  ])

  const totalBalance = accounts.reduce((sum, a) => sum + decimalToNumber((a as any).balance), 0)
  const txs = recentTransactions.map((tr) => ({
    ...tr,
    amount: decimalToNumber((tr as any).amount),
    date: new Date((tr as any).date).toISOString().split("T")[0],
  }))

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
              <div className="text-3xl font-bold text-chart-3">{txs.length}</div>
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
      </div>
    </div>
  )
}
