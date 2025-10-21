import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      message: "Sign out successful",
    })

    response.cookies.delete("session")

    return response
  } catch (error) {
    console.error("Sign out error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
