"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface HeroSectionProps {
  className?: string
  children?: React.ReactNode
}

export function HeroSection({ className, children }: HeroSectionProps) {
  return (
    <section className={cn(
      "container mx-auto px-6 flex flex-col items-center justify-center gap-8 py-16 md:py-20",
      className
    )}>
      {children}
    </section>
  )
}