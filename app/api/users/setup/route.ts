import { NextRequest, NextResponse } from "next/server"
import { withApiMiddleware } from "@/lib/api-middleware"
import { createDefaultCategoriesForUser } from "@/lib/default-categories"
import { prisma } from "@/lib/prisma"

async function handler(req: NextRequest) {
  const { userId } = req as any

  const existingCategories = await prisma.category.findFirst({
    where: { userId },
  })

  if (existingCategories) {
    return NextResponse.json({ message: "User already set up" })
  }

  await createDefaultCategoriesForUser(userId)

  return NextResponse.json({
    message: "User setup completed",
    categoriesCreated: 20,
  })
}

export async function POST(request: NextRequest) {
  return withApiMiddleware(request, handler, {
    requireAuth: true,
    rateLimit: { max: 5, window: 60000 },
  })
}
