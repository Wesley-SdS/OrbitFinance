"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface StatsSectionProps {
  children?: React.ReactNode
  className?: string
}

export function StatsSection({ children, className }: StatsSectionProps) {
  return (
    <section className={cn(
      "container mx-auto px-6 py-16 bg-gradient-to-br from-primary/5 to-transparent rounded-3xl my-16",
      className
    )}>
      {children}
    </section>
  )
}

interface StatItemProps {
  value: string
  label: string
  description: string
  className?: string
}

export function StatItem({ value, label, description, className }: StatItemProps) {
  return (
    <div className={cn("text-center", className)}>
      <div className="text-4xl font-bold text-gradient mb-2">{value}</div>
      <div className="text-lg font-semibold text-foreground mb-1">{label}</div>
      <div className="text-sm text-muted-foreground">{description}</div>
    </div>
  )
}