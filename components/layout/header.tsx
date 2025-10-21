"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface HeaderProps {
  children?: React.ReactNode
  className?: string
}

export function Header({ children, className }: HeaderProps) {
  return (
    <header className={cn(
      "glass sticky top-0 z-50 w-full border-b/50",
      className
    )}>
      {children}
    </header>
  )
}