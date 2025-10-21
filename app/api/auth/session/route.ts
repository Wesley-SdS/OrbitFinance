import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session")?.value

    if (!sessionId) {
      return NextResponse.json(null)
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!user) {
      return NextResponse.json(null)
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json(null)
  }
}
