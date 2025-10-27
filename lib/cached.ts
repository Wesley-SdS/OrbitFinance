import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { userTag } from "@/lib/cache-tags"

const CACHE_TTL = 60 * 5 // 5 minutes

export function getAccountsCached(userId: string) {
  return unstable_cache(
    async () => {
      return prisma.financialAccount.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          type: true,
          balance: true,
          currency: true,
          color: true,
          icon: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          userId: true
        },
        orderBy: { createdAt: "desc" },
      })
    },
    ["accounts", userId],
    {
      tags: [userTag(userId, "accounts")],
      revalidate: CACHE_TTL
    }
  )()
}

export function getCategoriesCached(userId: string, type?: string) {
  return unstable_cache(
    async () => {
      return prisma.category.findMany({
        where: { userId, ...(type ? { type: type as any } : {}) },
        select: {
          id: true,
          name: true,
          type: true,
          color: true,
          icon: true,
          isSystem: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
      })
    },
    ["categories", userId, type || "all"],
    { 
      tags: [userTag(userId, "categories")],
      revalidate: CACHE_TTL
    }
  )()
}

export function getGoalsCached(userId: string) {
  return unstable_cache(
    async () => {
      return prisma.goal.findMany({ 
        where: { userId }, 
        select: {
          id: true,
          name: true,
          targetAmount: true,
          currentAmount: true,
          deadline: true,
          category: true,
          color: true,
          icon: true,
          isCompleted: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" } 
      })
    },
    ["goals", userId],
    { 
      tags: [userTag(userId, "goals")],
      revalidate: CACHE_TTL
    }
  )()
}

export function getTransactionsCached(userId: string, opts?: { limit?: number }) {
  const limit = opts?.limit
  return unstable_cache(
    async () => {
      return prisma.transaction.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
          date: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          financialAccount: {
            select: {
              id: true,
              name: true,
              type: true,
              currency: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              type: true,
              color: true
            }
          }
        },
        orderBy: { date: "desc" },
        ...(limit ? { take: limit } : {}),
      })
    },
    ["transactions", userId, String(limit || 0)],
    { 
      tags: [userTag(userId, "transactions")],
      revalidate: CACHE_TTL
    }
  )()
}

export function getInsightsCached(userId: string) {
  return unstable_cache(
    async () => {
      return prisma.aiInsight.findMany({ 
        where: { userId }, 
        select: {
          id: true,
          insightType: true,
          title: true,
          content: true,
          priority: true,
          isRead: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" } 
      })
    },
    ["insights", userId],
    { 
      tags: [userTag(userId, "insights")],
      revalidate: CACHE_TTL
    }
  )()
}

export function getTasksCached(userId: string) {
  return unstable_cache(
    async () => {
      return prisma.task.findMany({
        where: { userId, status: 'open' },
        select: {
          id: true,
          text: true,
          dueAt: true,
          priority: true,
          status: true,
          createdAt: true
        },
        orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }]
      })
    },
    ["tasks", userId],
    { 
      tags: [userTag(userId, 'tasks')],
      revalidate: CACHE_TTL
    }
  )()
}

export function getRemindersCached(userId: string) {
  return unstable_cache(
    async () => {
      return prisma.reminder.findMany({
        where: { userId },
        select: {
          id: true,
          text: true,
          when: true,
          status: true,
          createdAt: true
        },
        orderBy: { when: 'asc' }
      })
    },
    ["reminders", userId],
    { 
      tags: [userTag(userId, 'reminders')],
      revalidate: CACHE_TTL
    }
  )()
}

export function getEventsRangeCached(userId: string, fromISO: string, toISO: string) {
  return unstable_cache(
    async () => {
      const from = new Date(fromISO)
      const to = new Date(toISO)
      return prisma.event.findMany({
        where: {
          userId,
          startAt: { gte: from, lt: to }
        },
        select: {
          id: true,
          title: true,
          startAt: true,
          endAt: true,
          createdAt: true
        },
        orderBy: { startAt: 'asc' }
      })
    },
    ["events", userId, fromISO, toISO],
    { 
      tags: [userTag(userId, 'events')],
      revalidate: CACHE_TTL
    }
  )()
}