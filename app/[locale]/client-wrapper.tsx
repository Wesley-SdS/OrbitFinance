"use client"

import { LanguageSwitcher } from "@/components/language-switcher"
import { AuthActions } from "@/components/auth/auth-actions"
import { Logo } from "@/components/brand/logo"
import { Header } from "@/components/layout/header"
import { Navigation } from "@/components/layout/navigation"

interface ClientWrapperProps {
  locale: string
}

export function ClientWrapper({ locale }: ClientWrapperProps) {
  return (
    <Header>
      <Navigation>
        <div className="flex items-center gap-3">
          <Logo showText={true} />
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <AuthActions locale={locale} />
        </div>
      </Navigation>
    </Header>
  )
}