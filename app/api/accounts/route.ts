import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const accounts = await prisma.financialAccount.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error("Failed to fetch accounts:", error)
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
    const { name, type, color, icon, currency = "USD" } = body

    const account = await prisma.financialAccount.create({
      data: {
        userId: session.user.id,
        name,
        type,
        color: color || "#3b82f6",
        icon: icon || "wallet",
        currency,
        balance: 0,
      }
    })

    return NextResponse.json({ account })
  } catch (error) {
    console.error("Failed to create account:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}