"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface HeroActionsProps {
  locale: string
  className?: string
}

export function HeroActions({ locale, className }: HeroActionsProps) {
  const t = useTranslations()
  return (
    <div className={cn(
      "flex flex-col gap-3 sm:flex-row sm:gap-4",
      className
    )}>
      <Button 
        asChild 
        size="lg" 
        className="px-6 py-3 shadow-lg hover-glow bg-gradient-to-r from-primary to-primary/80"
      >
        <Link href={`/${locale}/auth/sign-up`}>{t("home.startForFree")}</Link>
      </Button>
      <Button 
        asChild 
        size="lg" 
        variant="outline" 
        className="px-6 py-3 border-primary/30 bg-transparent hover:bg-primary/10"
      >
        <Link href={`/${locale}/auth/login`}>{t("home.signIn")}</Link>
      </Button>
    </div>
  )
}
