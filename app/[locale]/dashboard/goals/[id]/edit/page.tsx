import { getSession } from "@/lib/session"
import { GoalEditLoader } from "@/components/goal-edit-loader"
import { redirect } from "@/lib/navigation"
import { getTranslations, getLocale } from "next-intl/server"

export default async function EditGoalPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const { id } = params

  const session = await getSession()

  if (!session?.user) {
    const locale = await getLocale()
    redirect({ href: "/auth/login", locale })
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{(await getTranslations())("goals.edit")}</h1>
        <p className="text-muted-foreground">{(await getTranslations())("goals.description")}</p>
      </div>

      <GoalEditLoader id={id} />
    </div>
  )
}
