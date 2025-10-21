import { getSession } from "@/lib/session"
import { TransactionsList } from "@/components/transactions-list"
import { getTransactionsCached, getAccountsCached, getCategoriesCached } from "@/lib/cached"
import { Button } from "@/components/ui/button"
import { Link } from "@/lib/navigation"
import { redirect } from "@/lib/navigation"
import { getTranslations } from "next-intl/server"

export default async function TransactionsPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect("/auth/login")
  }


  const t = await getTranslations()
  const [transactions, accounts, categories] = await Promise.all([
    getTransactionsCached(session.user.id),
    getAccountsCached(session.user.id),
    getCategoriesCached(session.user.id),
  ])
  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("transactions.title")}</h1>
          <p className="text-muted-foreground">{t("transactions.description")}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/transactions/new">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="mr-2 h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t("transactions.new")}
          </Link>
        </Button>
      </div>

      <TransactionsList transactions={transactions as any} accounts={accounts as any} categories={categories as any} />
    </div>
  )
}
