import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { userTag } from "@/lib/cache-tags"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const insights = await prisma.aiInsight.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("Failed to fetch insights:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
