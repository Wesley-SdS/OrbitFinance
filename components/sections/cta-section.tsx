"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface CTASectionProps {
  children?: React.ReactNode
  className?: string
}

export function CTASection({ children, className }: CTASectionProps) {
  return (
    <section className={cn(
      "container mx-auto px-6 py-20",
      className
    )}>
      {children}
    </section>
  )
}

interface CTAContentProps {
  title: string
  description: string
  children?: React.ReactNode
  className?: string
}

export function CTAContent({ title, description, children, className }: CTAContentProps) {
  return (
    <div className={cn(
      "text-center max-w-3xl mx-auto",
      className
    )}>
      <h2 className="text-3xl font-bold text-gradient mb-4">{title}</h2>
      <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{description}</p>
      {children}
    </div>
  )
}