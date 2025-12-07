import { prisma } from '@/lib/prisma'
import type { Transaction, Category, FinancialAccount, Goal, Insight } from '@/lib/types'

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    select: {
      id: true,
      type: true,
      amount: true,
      description: true,
      date: true,
      categoryId: true,
      financialAccountId: true,
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      financialAccount: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  })

  return transactions.map(t => ({
    ...t,
    amount: Number(t.amount),
    accountId: t.financialAccountId,
    type: t.type as 'income' | 'expense',
    description: t.description || '',
    category: t.category,
    financialAccount: t.financialAccount,
  }))
}

export async function getCategories(userId: string): Promise<Category[]> {
  const categories = await prisma.category.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      color: true,
      userId: true,
      type: true,
      _count: {
        select: {
          transactions: {
            where: { deletedAt: null },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return categories.map(c => ({
    ...c,
    type: c.type as 'income' | 'expense' | 'both',
  }))
}

export async function getCategoriesBasic(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      color: true,
      type: true,
      icon: true,
    },
    orderBy: { name: 'asc' },
  })
}

export async function getFinancialAccounts(userId: string): Promise<FinancialAccount[]> {
  const accounts = await prisma.financialAccount.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      type: true,
      balance: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      currency: true,
      color: true,
      icon: true,
      isActive: true,
      _count: {
        select: {
          transactions: {
            where: { deletedAt: null },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return accounts.map(a => ({
    ...a,
    balance: Number(a.balance),
  }))
}

export async function getFinancialAccountsBasic(userId: string) {
  return prisma.financialAccount.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      type: true,
      color: true,
      icon: true,
    },
    orderBy: { name: 'asc' },
  })
}

export async function getGoals(userId: string): Promise<Goal[]> {
  const goals = await prisma.goal.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    orderBy: { deadline: 'asc' },
  })

  return goals.map(g => ({
    id: g.id,
    name: g.name,
    targetAmount: Number(g.targetAmount),
    currentAmount: Number(g.currentAmount),
    deadline: g.deadline,
    userId: g.userId,
    category: g.category,
  }))
}

export async function getInsights(userId: string): Promise<Insight[]> {
  const insights = await prisma.aiInsight.findMany({
    where: { userId },
    select: {
      id: true,
      insightType: true,
      title: true,
      content: true,
      userId: true,
      createdAt: true,
      isRead: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return insights.map(i => ({
    id: i.id,
    type: i.insightType,
    title: i.title,
    content: i.content,
    userId: i.userId,
    createdAt: i.createdAt,
    isRead: i.isRead,
  }))
}