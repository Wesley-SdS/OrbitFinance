import { getRequestConfig } from "next-intl/server"
import { routing } from "@/lib/routing"

export const locales = ["en", "pt", "es"] as const
export type Locale = (typeof locales)[number]

export default getRequestConfig(async ({ locale }) => {
  const resolved = locale ?? (routing as any).defaultLocale
  return {
    locale: resolved,
    messages: (await import(`../messages/${resolved}.json`)).default,
  }
})
