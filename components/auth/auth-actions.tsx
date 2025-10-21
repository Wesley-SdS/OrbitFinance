"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

interface AuthActionsProps {
  locale: string
  className?: string
}

export function AuthActions({ locale, className }: AuthActionsProps) {
  const t = useTranslations()
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Button 
        asChild 
        variant="ghost" 
        className="text-foreground/80 hover:text-foreground hover:bg-primary/10"
      >
        <a href={`/${locale}/auth/login`}>{t("auth.login")}</a>
      </Button>
      <Button 
        asChild 
        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover-glow"
      >
        <a href={`/${locale}/auth/sign-up`}>{t("home.getStarted")}</a>
      </Button>
    </div>
  )
}
