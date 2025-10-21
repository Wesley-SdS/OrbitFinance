import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { InsightsList } from "@/components/insights-list"
import { GenerateInsightsButton } from "@/components/generate-insights-button"
import { Button } from "@/components/ui/button"
import { Link } from "@/lib/navigation"
import { redirect } from "@/lib/navigation"
import { getTranslations } from "next-intl/server"

export default async function InsightsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/auth/login")
  }

  const insights = await prisma.aiInsight.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const t = await getTranslations()
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

      <InsightsList insights={insights} />
    </div>
  )
}
