import { getSession } from "@/lib/session"
import { AccountsList } from "@/components/accounts-list"
import { getAccountsCached } from "@/lib/cached"
import { Button } from "@/components/ui/button"
import { Link } from "@/lib/navigation"
import { redirect } from "@/lib/navigation"
import { getTranslations, getLocale } from "next-intl/server"

export default async function AccountsPage() {
  const session = await getSession()

  if (!session?.user) {
    const locale = await getLocale()
    redirect({ href: "/auth/login", locale })
  }

  const userId = session!.user.id
  const t = await getTranslations()
  const accounts = await getAccountsCached(userId)
  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("accounts.title")}</h1>
          <p className="text-muted-foreground">{t("accounts.description")}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/accounts/new">
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
            {t("accounts.new")}
          </Link>
        </Button>
      </div>

      <AccountsList accounts={accounts} />
    </div>
  )
}
