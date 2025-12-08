import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { challengeGenerator } from "@/lib/ai/challenge-generator"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const generate = searchParams.get("generate") === "true"

    if (generate) {
      await challengeGenerator.createChallenges(session.user.id, prisma)
    }

    const challenges = await prisma.challenge.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      challenges,
    })
  } catch (error) {
    console.error("Challenges fetch error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch challenges",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { challengeId, status, currentValue } = body as {
      challengeId: string
      status?: "accepted" | "completed" | "failed"
      currentValue?: number
    }

    if (!challengeId) {
      return NextResponse.json({ error: "Challenge ID is required" }, { status: 400 })
    }

    const challenge = await prisma.challenge.findFirst({
      where: {
        id: challengeId,
        userId: session.user.id,
      },
    })

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    const updated = await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        ...(status && { status }),
        ...(currentValue !== undefined && { currentValue }),
      },
    })

    return NextResponse.json({
      success: true,
      challenge: updated,
    })
  } catch (error) {
    console.error("Challenge update error:", error)
    return NextResponse.json(
      {
        error: "Failed to update challenge",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
