import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { CategoryFormClient } from "@/components/category-form-client"
import { notFound } from "next/navigation"
import { redirect } from "@/lib/navigation"
import { getTranslations } from "next-intl/server"

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const { id } = params

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/auth/login")
  }

  const category = await prisma.category.findFirst({
    where: {
      id: id,
      userId: session.user.id,
    },
  })

  if (!category) {
    notFound()
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{(await getTranslations())("categories.edit")}</h1>
        <p className="text-muted-foreground">{(await getTranslations())("categories.description")}</p>
      </div>

      <CategoryFormClient category={category} />
    </div>
  )
}
