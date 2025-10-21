import { getSession } from "@/lib/session"
import { InsightsList } from "@/components/insights-list"
import { getInsightsCached } from "@/lib/cached"
import { GenerateInsightsButton } from "@/components/generate-insights-button"
import { Button } from "@/components/ui/button"
import { Link } from "@/lib/navigation"
import { redirect } from "@/lib/navigation"
import { getTranslations } from "next-intl/server"

export default async function InsightsPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect("/auth/login")
  }


  const t = await getTranslations()
  const insights = await getInsightsCached(session.user.id)
  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("insights.title")}</h1>
          <p className="text-muted-foreground">{t("insights.description")}</p>
        </div>
        <div className="flex gap-2">
          <GenerateInsightsButton />
          <Button variant="outline" asChild>
            <Link href="/dashboard/transactions">{t("transactions.new")}</Link>
          </Button>
        </div>
      </div>

      <InsightsList insights={insights as any} />
    </div>
  )
}
