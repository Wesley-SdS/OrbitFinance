import { getSession } from "@/lib/session"
import { TransactionEditLoader } from "@/components/transaction-edit-loader"
import { redirect } from "@/lib/navigation"
import { getTranslations } from "next-intl/server"

export default async function EditTransactionPage({ params }: { params: { id: string } }) {
  const { id } = params

  const session = await getSession()

  if (!session?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{(await getTranslations())("transactions.edit")}</h1>
        <p className="text-muted-foreground">{(await getTranslations())("transactions.description")}</p>
      </div>

      <TransactionEditLoader id={id} />
    </div>
  )
}
