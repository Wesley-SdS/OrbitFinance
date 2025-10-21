import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { TransactionFormClient } from "@/components/transaction-form-client"
import { notFound } from "next/navigation"
import { redirect } from "@/lib/navigation"
import { getTranslations } from "next-intl/server"

export default async function EditTransactionPage({ params }: { params: { id: string } }) {
  const { id } = params

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/auth/login")
  }

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: id,
      userId: session.user.id,
    },
    include: {
      financialAccount: true,
      category: true,
    },
  })

  if (!transaction) {
    notFound()
  }

  const [accounts, categories] = await Promise.all([
    prisma.financialAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{(await getTranslations())("transactions.edit")}</h1>
        <p className="text-muted-foreground">{(await getTranslations())("transactions.description")}</p>
      </div>

      <TransactionFormClient 
        transaction={transaction} 
        accounts={accounts} 
        categories={categories} 
      />
    </div>
  )
}
