import { getSession } from "@/lib/session"
import { GoalsListClient } from "@/components/goals-list-client"
import { getGoals } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { Link } from "@/lib/navigation"
import { redirect } from "@/lib/navigation"
import { getTranslations, getLocale } from "next-intl/server"

export default async function GoalsPage() {
  const session = await getSession()

  if (!session?.user) {
    const locale = await getLocale()
    redirect({ href: "/auth/login", locale })
  }

  const userId = session!.user.id
  const t = await getTranslations()
  const goals = await getGoals(userId)

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("goals.title")}</h1>
          <p className="text-muted-foreground">{t("goals.description")}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/goals/new">
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
            {t("goals.new")}
          </Link>
        </Button>
      </div>

      <GoalsListClient initialGoals={goals} />
    </div>
  )
}
