import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { CategoriesList } from "@/components/categories-list"
import { Button } from "@/components/ui/button"
import { Link } from "@/lib/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { redirect } from "@/lib/navigation"
import { getTranslations } from "next-intl/server"

export default async function CategoriesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/auth/login")
  }

  const categories = await prisma.category.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const incomeCategories = categories.filter((c) => c.type === "income")
  const expenseCategories = categories.filter((c) => c.type === "expense")

  const t = await getTranslations()
  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("categories.title")}</h1>
          <p className="text-muted-foreground">{t("categories.description")}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/categories/new">
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
            {t("categories.new")}
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="expense" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="expense">{t("transactions.expense")}</TabsTrigger>
          <TabsTrigger value="income">{t("transactions.income")}</TabsTrigger>
        </TabsList>
        <TabsContent value="expense" className="mt-6">
          <CategoriesList categories={expenseCategories} type="expense" />
        </TabsContent>
        <TabsContent value="income" className="mt-6">
          <CategoriesList categories={incomeCategories} type="income" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
