"use client"

import type React from "react"

import { signIn } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthInteractiveBackground } from "@/components/auth-interactive-background"
import { AuthLayout } from "@/components/auth-layout"
import { SocialLogin } from "@/components/auth/social-login"
import { Link, useRouter } from "@/lib/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const t = useTranslations()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn.email({ email, password, callbackURL: "/dashboard" })

      if (result.error) {
        // Handle specific Better Auth errors
        if (result.error.message?.includes("User not found") || result.error.message?.includes("Invalid credentials")) {
          toast.error("Email não cadastrado ou senha incorreta")
        } else {
          toast.error(result.error.message || "Erro ao fazer login")
        }
        return
      }

      toast.success("Login realizado com sucesso!")
      router.replace("/dashboard")
      return
    } catch (error: unknown) {
      console.error("Login error:", error)
      toast.error("Erro inesperado ao fazer login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <AuthInteractiveBackground />
      <AuthLayout title={t("auth.welcomeBack")} subtitle={t("auth.enterCredentials")}>
        <form onSubmit={handleLogin}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("auth.signingIn") : t("auth.login")}
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t("auth.orContinueWith")}
              </span>
            </div>
          </div>

          <SocialLogin />

          <div className="mt-4 text-center text-sm">
            {t("auth.noAccount") + " "}
            <Link href="/auth/sign-up" className="hover:text-primary underline underline-offset-4">
              {t("auth.signUp")}
            </Link>
          </div>
        </form>
      </AuthLayout>
    </>
  )
}
