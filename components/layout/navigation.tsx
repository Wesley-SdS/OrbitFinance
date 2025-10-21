"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface NavigationProps {
  children?: React.ReactNode
  className?: string
}

export function Navigation({ children, className }: NavigationProps) {
  return (
    <nav className={cn(
      "container mx-auto flex h-16 items-center justify-between gap-4 px-6",
      className
    )}>
      {children}
    </nav>
  )
}