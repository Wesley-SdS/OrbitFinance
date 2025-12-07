import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { apiLimiter, RateLimitError } from "@/lib/rate-limit"

export interface AuthenticatedRequest extends NextRequest {
  userId: string
  user: {
    id: string
    email: string
    name: string | null
  }
}

interface ApiMiddlewareOptions {
  requireAuth?: boolean
  rateLimit?: {
    max: number
    window: number
  }
}

export async function withApiMiddleware(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: ApiMiddlewareOptions = { requireAuth: true }
) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "anonymous"

    if (options.rateLimit) {
      try {
        await apiLimiter.check(options.rateLimit.max, ip)
      } catch (error) {
        if (error instanceof RateLimitError) {
          return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429 }
          )
        }
        throw error
      }
    }

    if (options.requireAuth) {
      const session = await auth.api.getSession({ headers: request.headers })

      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.userId = session.user.id
      authenticatedRequest.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      }

      return await handler(authenticatedRequest)
    }

    return await handler(request as AuthenticatedRequest)
  } catch (error) {
    console.error("API Middleware Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
