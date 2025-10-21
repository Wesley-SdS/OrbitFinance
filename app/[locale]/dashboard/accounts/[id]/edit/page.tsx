import type { Metadata } from "next"
import { getSession } from "@/lib/session"
import { redirect } from "@/lib/navigation"
import { AccountEditLoader } from "@/components/account-edit-loader"
import { getTranslations } from "next-intl/server"

interface EditAccountPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations()
  return { title: t("accounts.edit") }
}

export default async function EditAccountPage({ params }: EditAccountPageProps) {
  const { id } = params
  const session = await getSession()
  if (!session?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold">{(await getTranslations())("accounts.edit")}</h1>
        <AccountEditLoader id={id} />
      </div>
    </div>
  )
}
