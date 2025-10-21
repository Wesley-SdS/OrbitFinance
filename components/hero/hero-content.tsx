"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface HeroContentProps {
  title: string
  description: string
  className?: string
}

export function HeroContent({ title, description, className }: HeroContentProps) {
  return (
    <div className={cn(
      "flex max-w-3xl flex-col items-center gap-6 text-center",
      className
    )}>
      <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
        <span className="text-gradient">{title}</span>
      </h1>
      <p className="text-muted-foreground text-lg text-balance leading-relaxed">
        {description}
      </p>
    </div>
  )
}