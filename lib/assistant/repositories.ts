import { Prisma, PrismaClient, AccountType, CategoryType, TransactionType, ReminderStatus } from '@prisma/client'
import { prisma } from '../prisma'

export interface UserRepo {
  getOrCreateByPhone(phone: string): Promise<{ id: string; phone: string }>
}

export interface TransactionRepo {
  create(input: {
    userId: string
    type: 'INCOME' | 'EXPENSE'
    amount: number
    occurredAt: Date
    description?: string
    categoryName?: string
  }): Promise<{ id: string; categoryId: string }>
  listByPeriod(userId: string, from: Date, to: Date): Promise<Array<{ amount: number; type: 'INCOME' | 'EXPENSE'; category: string | null }>>
  listRecentByCategory(userId: string, categoryId: string, limit: number): Promise<Array<{ amount: number; date: Date }>>
}

export interface TaskRepo {
  create(input: { userId: string; text: string; dueAt?: Date | null; priority: 'low' | 'medium' | 'high' }): Promise<string>
  listOpen(userId: string): Promise<Array<{ id: string; text: string; dueAt: Date | null; priority: 'low' | 'medium' | 'high' }>>
  complete(userId: string, id: string): Promise<void>
}

export interface EventRepo {
  create(input: { userId: string; title: string; startAt: Date; endAt?: Date | null }): Promise<string>
  listByRange(userId: string, from: Date, to: Date): Promise<Array<{ title: string; startAt: Date; endAt: Date | null }>>
}

export interface ReminderRepo {
  create(input: { userId: string; text: string; when: Date }): Promise<string>
  listDue(now: Date): Promise<Array<{ id: string; userId: string; text: string; when: Date }>>
  markSent(id: string): Promise<void>
}

export interface MessageLogRepo {
  logInbound(input: { userId?: string | null; providerId?: string | null; type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'DOCUMENT'; content?: string }): Promise<void>
  logOutbound(input: { userId?: string | null; providerId?: string | null; type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'DOCUMENT'; content?: string }): Promise<void>
  existsProviderId(providerId: string): Promise<boolean>
}

export interface AttachmentRepo {
  create(input: { transactionId: string; url: string; kind: 'IMAGE' | 'AUDIO' | 'PDF'; providerId?: string | null }): Promise<string>
}

export class PrismaUserRepo implements UserRepo {
  constructor(private readonly db: PrismaClient = prisma) {}
  async getOrCreateByPhone(phone: string) {
    const normalized = phone
    const found = await this.db.user.findFirst({ where: { phone: normalized } })
    if (found) return { id: found.id, phone: normalized }
    // create minimal user with synthetic email
    const email = `wa-${normalized}@local.invalid`
    const created = await this.db.user.create({ data: { email, phone: normalized, emailVerified: false } })
    return { id: created.id, phone: normalized }
  }
}

export class PrismaTransactionRepo implements TransactionRepo {
  constructor(private readonly db: PrismaClient = prisma) {}

  private async getDefaultAccount(userId: string) {
    let acc = await this.db.financialAccount.findFirst({ where: { userId, isActive: true } })
    if (acc) return acc
    acc = await this.db.financialAccount.create({
      data: {
        userId,
        name: 'Carteira',
        type: AccountType.cash,
        currency: 'BRL',
        color: '#6b7280',
        icon: 'wallet',
      },
    })
    return acc
  }

  private async getCategory(userId: string, name: string | null, type: CategoryType) {
    if (name) {
      const found = await this.db.category.findFirst({ where: { userId, name: name, type } })
      if (found) return found
      return await this.db.category.create({ data: { userId, name, type } })
    }
    // fallback: find any category of the type
    let any = await this.db.category.findFirst({ where: { userId, type } })
    if (any) return any
    // create default
    return await this.db.category.create({ data: { userId, name: type === 'income' ? 'renda' : 'geral', type } })
  }

  async create(input: { userId: string; type: 'INCOME' | 'EXPENSE'; amount: number; occurredAt: Date; description?: string; categoryName?: string }): Promise<{ id: string; categoryId: string }> {
    const account = await this.getDefaultAccount(input.userId)
    const catType: CategoryType = input.type === 'INCOME' ? 'income' : 'expense'
    const category = await this.getCategory(input.userId, input.categoryName ?? null, catType)
    const tx = await this.db.transaction.create({
      data: {
        userId: input.userId,
        financialAccountId: account.id,
        categoryId: category.id,
        type: input.type === 'INCOME' ? TransactionType.income : TransactionType.expense,
        amount: new Prisma.Decimal(input.amount),
        description: input.description ?? null,
        date: new Date(input.occurredAt.getFullYear(), input.occurredAt.getMonth(), input.occurredAt.getDate()),
      },
    })
    return { id: tx.id, categoryId: tx.categoryId }
  }

  async listByPeriod(userId: string, from: Date, to: Date): Promise<Array<{ amount: number; type: 'INCOME' | 'EXPENSE'; category: string | null }>> {
    const txs = await this.db.transaction.findMany({
      where: { userId, date: { gte: from, lt: to } },
      include: { category: true },
      orderBy: { date: 'desc' },
    })
    return txs.map((t) => ({
      amount: Number(t.amount),
      type: (t.type === 'income' ? 'INCOME' : 'EXPENSE') as 'INCOME' | 'EXPENSE',
      category: t.category?.name ?? null
    }))
  }

  async listRecentByCategory(userId: string, categoryId: string, limit: number) {
    const txs = await this.db.transaction.findMany({
      where: { userId, categoryId },
      orderBy: { date: 'desc' },
      take: limit,
    })
    return txs.map((t) => ({ amount: Number(t.amount), date: t.date }))
  }
}

export interface AiInsightRepo {
  create(input: { userId: string; title: string; content: string; insightType?: 'budget_alert' | 'spending_pattern' | 'general'; priority?: 'low' | 'medium' | 'high' }): Promise<string>
}

export class PrismaAiInsightRepo implements AiInsightRepo {
  constructor(private readonly db: PrismaClient = prisma) {}
  async create(input: { userId: string; title: string; content: string; insightType?: 'budget_alert' | 'spending_pattern' | 'general'; priority?: 'low' | 'medium' | 'high' }) {
    const created = await this.db.aiInsight.create({
      data: {
        userId: input.userId,
        title: input.title,
        content: input.content,
        insightType: (input.insightType ?? 'general') as any,
        priority: (input.priority ?? 'medium') as any,
      },
    })
    return created.id
  }
}

export class PrismaTaskRepo implements TaskRepo {
  constructor(private readonly db: PrismaClient = prisma) {}
  async create(input: { userId: string; text: string; dueAt?: Date | null; priority: 'low' | 'medium' | 'high' }) {
    const created = await this.db.task.create({ data: { userId: input.userId, text: input.text, dueAt: input.dueAt ?? null, priority: input.priority } })
    return created.id
  }
  async listOpen(userId: string) {
    const items = await this.db.task.findMany({ where: { userId, status: 'open' }, orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }] })
    return items.map((t) => ({ id: t.id, text: t.text, dueAt: t.dueAt, priority: t.priority }))
  }
  async complete(userId: string, id: string) {
    await this.db.task.update({ where: { id }, data: { status: 'done' } })
  }
}

export class PrismaEventRepo implements EventRepo {
  constructor(private readonly db: PrismaClient = prisma) {}
  async create(input: { userId: string; title: string; startAt: Date; endAt?: Date | null }) {
    const created = await this.db.event.create({ data: { userId: input.userId, title: input.title, startAt: input.startAt, endAt: input.endAt ?? null } })
    return created.id
  }
  async listByRange(userId: string, from: Date, to: Date) {
    const items = await this.db.event.findMany({ where: { userId, startAt: { gte: from, lt: to } }, orderBy: { startAt: 'asc' } })
    return items.map((e) => ({ title: e.title, startAt: e.startAt, endAt: e.endAt }))
  }
}

export class PrismaReminderRepo implements ReminderRepo {
  constructor(private readonly db: PrismaClient = prisma) {}
  async create(input: { userId: string; text: string; when: Date }) {
    const created = await this.db.reminder.create({ data: { userId: input.userId, text: input.text, when: input.when } })
    return created.id
  }
  async listDue(now: Date) {
    const items = await this.db.reminder.findMany({ where: { when: { lte: now }, status: ReminderStatus.PENDING }, orderBy: { when: 'asc' } })
    return items.map((r) => ({ id: r.id, userId: r.userId, text: r.text, when: r.when }))
  }
  async markSent(id: string) {
    await this.db.reminder.update({ where: { id }, data: { status: ReminderStatus.SENT } })
  }
}

export class PrismaMessageLogRepo implements MessageLogRepo {
  constructor(private readonly db: PrismaClient = prisma) {}
  async logInbound(input: { userId?: string | null; providerId?: string | null; type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'DOCUMENT'; content?: string }) {
    await this.db.messageLog.create({ data: { userId: input.userId ?? null, providerId: input.providerId ?? null, direction: 'INBOUND', type: input.type, content: input.content ?? null } as any })
  }
  async logOutbound(input: { userId?: string | null; providerId?: string | null; type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'DOCUMENT'; content?: string }) {
    await this.db.messageLog.create({ data: { userId: input.userId ?? null, providerId: input.providerId ?? null, direction: 'OUTBOUND', type: input.type, content: input.content ?? null } as any })
  }
  async existsProviderId(providerId: string) {
    const found = await this.db.messageLog.findFirst({ where: { providerId } })
    return !!found
  }
}

export class PrismaAttachmentRepo implements AttachmentRepo {
  constructor(private readonly db: PrismaClient = prisma) {}
  async create(input: { transactionId: string; url: string; kind: 'IMAGE' | 'AUDIO' | 'PDF'; providerId?: string | null }) {
    const created = await this.db.attachment.create({ data: { transactionId: input.transactionId, url: input.url, kind: input.kind as any, providerId: input.providerId ?? null } })
    return created.id
  }
}
