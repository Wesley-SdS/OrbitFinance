import type React from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface LogoProps {
  className?: string
  showText?: boolean
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/placeholder-logo.png"
        alt="OrbiFinance"
        width={40}
        height={40}
        className="rounded-xl"
        priority
      />
      {showText && (
        <span className="text-xl font-bold text-gradient">OrbiFinance</span>
      )}
    </div>
  )
}