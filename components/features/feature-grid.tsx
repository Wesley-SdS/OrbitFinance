"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface FeatureGridProps {
  children: React.ReactNode
  className?: string
}

export function FeatureGrid({ children, className }: FeatureGridProps) {
  return (
    <div className={cn(
      "mt-12 grid w-full max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3 mx-auto px-4 sm:px-6",
      className
    )}>
      {children}
    </div>
  )
}