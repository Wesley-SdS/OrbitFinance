import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function decimalToNumber(value: any): number {
  if (typeof value === "number") return value
  if (value?.toNumber) return value.toNumber()
  if (value?.toString) return parseFloat(value.toString())
  return 0
}

export function calculatePercentage(part: any, total: any): number {
  const partNum = decimalToNumber(part)
  const totalNum = decimalToNumber(total)
  return totalNum > 0 ? (partNum / totalNum) * 100 : 0
}
