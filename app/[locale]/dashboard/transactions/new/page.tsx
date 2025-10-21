import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { TransactionFormClient } from "@/components/transaction-form-client"
import { Link } from "@/lib/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function NewTransactionPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/auth/login")
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
    <div className="container max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/transactions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Transactions
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Add New Transaction</h1>
        <p className="text-muted-foreground">Record a new income or expense</p>
      </div>

      <div className="bg-card p-6 rounded-lg border">
        <TransactionFormClient 
          accounts={accounts}
          categories={categories}
        />
      </div>
    </div>
  )
}
