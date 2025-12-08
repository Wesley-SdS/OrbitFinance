"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/lib/navigation"
import { Button } from "@/components/ui/button"
import { AuthInteractiveBackground } from "@/components/auth-interactive-background"
import { useTranslations } from "next-intl"

export default function SignUpSuccessPage() {
  const t = useTranslations()

  return (
    <>
      <AuthInteractiveBackground />
      <div className="relative z-10 flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 backdrop-blur-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-8 w-8 text-green-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <CardTitle className="text-2xl text-white">{t("auth.checkEmail")}</CardTitle>
              <CardDescription className="text-gray-300">
                {t("auth.confirmationSent")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-sm text-gray-400">
                {t("auth.clickLinkToActivate")}
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10">
                  <Link href="/auth/login">{t("auth.returnToLogin")}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
