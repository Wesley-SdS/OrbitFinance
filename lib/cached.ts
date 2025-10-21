import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { userTag } from "@/lib/cache-tags"

export function getAccountsCached(userId: string) {
  return unstable_cache(
    async () => {
      return prisma.financialAccount.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      })
    },
    ["accounts", userId],
    { tags: [userTag(userId, "accounts")] }
  )()
}

export function getCategoriesCached(userId: string, type?: string) {
  return unstable_cache(
    async () => {
      return prisma.category.findMany({
        where: { userId, ...(type ? { type: type as any } : {}) },
        orderBy: { createdAt: "desc" },
      })
    },
    ["categories", userId, type || "all"],
    { tags: [userTag(userId, "categories")] }
  )()
}

export function getGoalsCached(userId: string) {
  return unstable_cache(
    async () => {
      return prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
    },
    ["goals", userId],
    { tags: [userTag(userId, "goals")] }
  )()
}

export function getTransactionsCached(userId: string, opts?: { limit?: number }) {
  const limit = opts?.limit
  return unstable_cache(
    async () => {
      return prisma.transaction.findMany({
        where: { userId },
        include: { financialAccount: true, category: true },
        orderBy: { date: "desc" },
        ...(limit ? { take: limit } : {}),
      })
    },
    ["transactions", userId, String(limit || 0)],
    { tags: [userTag(userId, "transactions")] }
  )()
}

export function getInsightsCached(userId: string) {
  return unstable_cache(
    async () => {
      return prisma.aiInsight.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
    },
    ["insights", userId],
    { tags: [userTag(userId, "insights")] }
  )()
}

