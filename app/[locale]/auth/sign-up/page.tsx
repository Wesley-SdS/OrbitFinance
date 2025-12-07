"use client"

import type React from "react"

import { signUp } from "@/lib/auth-client"
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

export default function SignUpPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const t = useTranslations()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres")
      setIsLoading(false)
      return
    }

    if (whatsapp && whatsapp.replace(/\D/g, '').length < 10) {
      toast.error("WhatsApp deve ter pelo menos 10 dígitos")
      setIsLoading(false)
      return
    }

    try {
      const result = await signUp.email({
        email,
        password,
        name: fullName,
      })

      if (result.error) {
        if (
          result.error.message?.includes("User already exists") ||
          result.error.message?.includes("Email already exists")
        ) {
          toast.error("Este email já está cadastrado")
        } else if (result.error.message?.includes("Password too short")) {
          toast.error("A senha é muito curta")
        } else {
          toast.error(result.error.message || "Erro ao criar conta")
        }
        return
      }

      if (whatsapp) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
          const response = await fetch(`${baseUrl}/api/user/whatsapp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ phone: whatsapp })
          })

          if (!response.ok) {
            const error = await response.json()
            console.error("WhatsApp link failed:", error)
            toast.error("WhatsApp não vinculado", {
              description: error.error || "Não foi possível vincular seu WhatsApp. Você pode configurar depois.",
            })
          } else {
            toast.success("WhatsApp vinculado!", {
              description: "Agora você pode enviar mensagens para registrar transações.",
            })
          }
        } catch (whatsappError) {
          console.error("WhatsApp link error:", whatsappError)
          toast.error("Erro ao vincular WhatsApp", {
            description: "Você pode configurar o WhatsApp depois no dashboard.",
          })
        }
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
        await fetch(`${baseUrl}/api/users/setup`, {
          method: "POST",
          credentials: "include",
        })
      } catch (setupError) {
        console.error("Setup error:", setupError)
      }

      toast.success("Conta criada com sucesso!")
      router.replace("/auth/sign-up-success")
    } catch (error: unknown) {
      console.error("Sign up error:", error)
      toast.error("Erro inesperado ao criar conta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <AuthInteractiveBackground />
      <AuthLayout title={t("auth.createAccountTitle")} subtitle={t("auth.createAccountSubtitle")}>
        <form onSubmit={handleSignUp}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="fullName">{t("auth.fullName")}</Label>
              <Input
                id="fullName"
                type="text"
                placeholder={t("auth.fullNamePlaceholder")}
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
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
              <Label htmlFor="whatsapp">{t("auth.whatsapp") || "WhatsApp"}</Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="(11) 96092-4734"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
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
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("auth.creatingAccount") : t("auth.createAccount")}
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
            {t("auth.hasAccount") + " "}
            <Link href="/auth/login" className="hover:text-primary underline underline-offset-4">
              {t("auth.login")}
            </Link>
          </div>
        </form>
      </AuthLayout>
    </>
  )
}
