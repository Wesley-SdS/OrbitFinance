import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { userTag } from "@/lib/cache-tags"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    const whereClause: any = {
      userId: session.user.id
    }
    
    if (type) {
      whereClause.type = type
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { name, type, color, icon } = body

    const category = await prisma.category.create({
      data: {
        userId: session.user.id,
        name,
        type,
        color: color || "#6b7280",
        icon: icon || "tag",
        isSystem: false,
      }
    })

    revalidateTag(userTag(session.user.id, "categories"))
    return NextResponse.json({ category })
  } catch (error) {
    console.error("Failed to create category:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
