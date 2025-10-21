"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface TestimonialSectionProps {
  children?: React.ReactNode
  className?: string
}

export function TestimonialSection({ children, className }: TestimonialSectionProps) {
  return (
    <section className={cn(
      "container mx-auto px-6 py-16",
      className
    )}>
      {children}
    </section>
  )
}

interface TestimonialCardProps {
  quote: string
  author: string
  role: string
  avatar?: string
  className?: string
}

export function TestimonialCard({ quote, author, role, avatar, className }: TestimonialCardProps) {
  return (
    <div className={cn(
      "glass p-6 rounded-xl border border-border/50 hover-glow transition-all duration-300",
      className
    )}>
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
          {avatar || author.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="text-foreground mb-4 leading-relaxed">"{quote}"</p>
          <div>
            <div className="font-semibold text-foreground">{author}</div>
            <div className="text-sm text-muted-foreground">{role}</div>
          </div>
        </div>
      </div>
    </div>
  )
}