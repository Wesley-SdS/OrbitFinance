import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { description, originalCategory, correctedCategory } = body as {
      description: string
      originalCategory: string
      correctedCategory: string
    }

    if (!description || !originalCategory || !correctedCategory) {
      return NextResponse.json(
        { error: "Missing required fields: description, originalCategory, correctedCategory" },
        { status: 400 }
      )
    }

    const feedback = await prisma.categoryFeedback.create({
      data: {
        userId: session.user.id,
        description,
        originalCategory,
        correctedCategory,
      },
    })

    return NextResponse.json({
      success: true,
      feedback,
    })
  } catch (error) {
    console.error("Category feedback error:", error)
    return NextResponse.json(
      {
        error: "Failed to save category feedback",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const feedbacks = await prisma.categoryFeedback.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    })

    const learnings = feedbacks.reduce(
      (acc, f) => {
        const key = f.description.toLowerCase().slice(0, 15)
        if (!acc[key]) {
          acc[key] = f.correctedCategory
        }
        return acc
      },
      {} as Record<string, string>
    )

    return NextResponse.json({
      success: true,
      feedbacks,
      learnings,
    })
  } catch (error) {
    console.error("Category feedback fetch error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch category feedback",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
