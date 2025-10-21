import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { redirect } from "@/lib/navigation"
import { AccountFormClient } from "@/components/account-form-client"
import { getTranslations } from "next-intl/server"

interface EditAccountPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: EditAccountPageProps): Promise<Metadata> {
  const { id } = params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { title: "Unauthorized" }
  }

  const account = await prisma.financialAccount.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  })

  const t = await getTranslations()
  return {
    title: account ? `${t("accounts.edit")} - ${account.name}` : t("accounts.edit"),
  }
}

export default async function EditAccountPage({ params }: EditAccountPageProps) {
  const { id } = params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect("/auth/login")
  }

  const account = await prisma.financialAccount.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  })

  if (!account) {
    redirect("/dashboard/accounts")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold">{(await getTranslations())("accounts.edit")}</h1>
        <AccountFormClient account={account} />
      </div>
    </div>
  )
}
