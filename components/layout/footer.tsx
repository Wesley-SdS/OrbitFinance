"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface FooterProps {
  children?: React.ReactNode
  className?: string
}

export function Footer({ children, className }: FooterProps) {
  return (
    <footer className={cn(
      "border-t border-border/30 bg-card/50 backdrop-blur-sm py-8 md:py-12 mt-20",
      className
    )}>
      {children}
    </footer>
  )
}