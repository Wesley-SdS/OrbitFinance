import { getSession } from "@/lib/session"
import { redirect } from "@/lib/navigation"
import { Suspense } from "react"
import { getTranslations, getLocale } from "next-intl/server"
import { DashboardSkeleton } from "./dashboard-skeleton"
import { DashboardContent } from "./dashboard-content"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user) {
    const locale = await getLocale()
    redirect({ href: "/auth/login", locale })
  }

  const userId = session!.user.id
  const t = await getTranslations()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container max-w-7xl p-6 lg:p-8">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gradient mb-2">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground text-lg">{t("dashboard.welcome")}! {t("dashboard.overview")}</p>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent userId={userId} t={t} />
        </Suspense>
      </div>
    </div>
  )
}