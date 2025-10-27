import createMiddleware from "next-intl/middleware"
import { routing } from "@/lib/routing"

export default createMiddleware(routing)

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    "/((?!api|_next|_vercel|.*\\..*).*)",
    // However, match all pathnames within `/api/`, except for the ones
    // within `/api/auth` or `/api/trpc`
    "/api/((?!auth|trpc).*)"
  ]
}