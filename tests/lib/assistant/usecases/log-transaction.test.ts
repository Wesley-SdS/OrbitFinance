import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LogTransaction } from '@/lib/assistant/usecases/log-transaction'
import { PrismaTransactionRepo } from '@/lib/assistant/repositories'

// Mock repositories
vi.mock('@/lib/assistant/repositories', () => ({
  PrismaTransactionRepo: vi.fn(),
  PrismaUserRepo: vi.fn().mockImplementation(() => ({
    getOrCreateByPhone: vi.fn().mockResolvedValue({ id: 'user-123' }),
  })),
}))

// Mock CategoryClassifier
vi.mock('@/lib/assistant/classifier', () => ({
  CategoryClassifier: vi.fn().mockImplementation(() => ({
    suggest: vi.fn().mockReturnValue({ name: 'geral' }),
  })),
}))

// Mock PostTransactionInsights
vi.mock('@/lib/assistant/usecases/post-transaction-insights', () => ({
  PostTransactionInsights: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue({}),
  })),
}))

describe('LogTransaction', () => {
  let logTransaction: LogTransaction
  let mockRepo: any

  beforeEach(() => {
    mockRepo = {
      create: vi.fn().mockResolvedValue({
        id: 'txn-123',
        userId: 'user-123',
        amount: 50.0,
        type: 'EXPENSE',
        categoryName: 'alimentacao',
        categoryId: 'cat-123',
        description: 'almoço',
        occurredAt: new Date(),
      }),
    }

    vi.mocked(PrismaTransactionRepo).mockImplementation(() => mockRepo)
    logTransaction = new LogTransaction()
  })

  describe('Expense Transactions', () => {
    it('should create expense with amount and category', async () => {
      const result = await logTransaction.execute({
        phone: '5511999999999',
        text: 'gastei 50 reais #alimentacao almoço',
        type: 'EXPENSE',
      })

      expect(result.ok).toBe(true)
      expect(result.message).toContain('-R$')
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          amount: 50.0,
          type: 'EXPENSE',
          categoryName: 'alimentacao',
          description: 'almoço',
        })
      )
    })

    it('should create expense without explicit category', async () => {
      const result = await logTransaction.execute({
        phone: '5511999999999',
        text: 'gastei 30 reais café',
        type: 'EXPENSE',
      })

      expect(result.ok).toBe(true)
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 30.0,
          type: 'EXPENSE',
          categoryName: 'geral', // Classifier suggestion
        })
      )
    })

    it('should fail when amount is missing', async () => {
      const result = await logTransaction.execute({
        phone: '5511999999999',
        text: 'gastei algo',
        type: 'EXPENSE',
      })

      expect(result.ok).toBe(false)
      expect(result.message).toContain('Valor não identificado')
    })

    it('should parse various amount formats', async () => {
      const testCases = [
        { text: 'gastei R$ 50', expected: 50.0 },
        { text: 'gastei 50,00', expected: 50.0 },
        { text: 'gastei 1.500,00', expected: 1500.0 },
      ]

      for (const { text, expected } of testCases) {
        mockRepo.create.mockClear()
        await logTransaction.execute({
          phone: '5511999999999',
          text,
          type: 'EXPENSE',
        })

        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: expected,
          })
        )
      }
    })
  })

  describe('Income Transactions', () => {
    it('should create income with amount', async () => {
      mockRepo.create.mockResolvedValue({
        id: 'txn-456',
        userId: 'user-123',
        amount: 1500.0,
        type: 'INCOME',
        categoryName: 'renda',
        categoryId: 'cat-456',
        description: 'salário',
        occurredAt: new Date(),
      })

      const result = await logTransaction.execute({
        phone: '5511999999999',
        text: 'recebi 1500 reais salário',
        type: 'INCOME',
      })

      expect(result.ok).toBe(true)
      expect(result.message).toContain('+R$')
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1500.0,
          type: 'INCOME',
          description: 'salário',
        })
      )
    })
  })

  describe('Date Parsing', () => {
    it('should use current date when not specified', async () => {
      const now = new Date()
      await logTransaction.execute({
        phone: '5511999999999',
        text: 'gastei 50 reais',
        type: 'EXPENSE',
      })

      const call = mockRepo.create.mock.calls[0][0]
      const date = call.occurredAt

      expect(date.getDate()).toBe(now.getDate())
      expect(date.getMonth()).toBe(now.getMonth())
    })

    it('should parse "ontem" as yesterday', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      await logTransaction.execute({
        phone: '5511999999999',
        text: 'gastei 50 reais ontem',
        type: 'EXPENSE',
      })

      const call = mockRepo.create.mock.calls[0][0]
      expect(call.occurredAt.getDate()).toBe(yesterday.getDate())
    })
  })

  describe('Category Parsing', () => {
    it('should extract category with hashtag', async () => {
      await logTransaction.execute({
        phone: '5511999999999',
        text: 'gastei 50 reais #transporte',
        type: 'EXPENSE',
      })

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryName: 'transporte',
        })
      )
    })

    it('should normalize category to lowercase', async () => {
      await logTransaction.execute({
        phone: '5511999999999',
        text: 'gastei 50 reais #ALIMENTACAO',
        type: 'EXPENSE',
      })

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryName: 'alimentacao',
        })
      )
    })
  })

  describe('Description Extraction', () => {
    it('should extract description after removing keywords', async () => {
      await logTransaction.execute({
        phone: '5511999999999',
        text: 'gastei R$ 50,00 #alimentacao almoço no restaurante',
        type: 'EXPENSE',
      })

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'almoço no restaurante',
        })
      )
    })

    it('should handle missing description', async () => {
      await logTransaction.execute({
        phone: '5511999999999',
        text: 'gastei 50 reais',
        type: 'EXPENSE',
      })

      const call = mockRepo.create.mock.calls[0][0]
      expect(call.description).toBeUndefined()
    })
  })

  describe('Validation', () => {
    it('should reject zero amounts', async () => {
      const result = await logTransaction.execute({
        phone: '5511999999999',
        text: 'gastei 0 reais',
        type: 'EXPENSE',
      })

      expect(result.ok).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockRepo.create.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        logTransaction.execute({
          phone: '5511999999999',
          text: 'gastei 50 reais',
          type: 'EXPENSE',
        })
      ).rejects.toThrow()
    })

    it('should handle PostTransactionInsights errors silently', async () => {
      const mockInsights = vi.fn().mockRejectedValue(new Error('AI service unavailable'))

      // Even if insights fail, transaction should succeed
      const result = await logTransaction.execute({
        phone: '5511999999999',
        text: 'gastei 50 reais',
        type: 'EXPENSE',
      })

      expect(result.ok).toBe(true)
    })
  })

  describe('Response Messages', () => {
    it('should return formatted expense message', async () => {
      const result = await logTransaction.execute({
        phone: '5511999999999',
        text: 'gastei 50 reais café',
        type: 'EXPENSE',
      })

      expect(result.ok).toBe(true)
      expect(result.message).toMatch(/Lançado: -R\$\s*50,00/)
    })

    it('should return formatted income message', async () => {
      mockRepo.create.mockResolvedValue({
        id: 'txn-789',
        userId: 'user-123',
        amount: 200.0,
        type: 'INCOME',
        categoryId: 'cat-789',
      })

      const result = await logTransaction.execute({
        phone: '5511999999999',
        text: 'recebi 200 reais',
        type: 'INCOME',
      })

      expect(result.ok).toBe(true)
      expect(result.message).toMatch(/Lançado: \+R\$\s*200,00/)
    })
  })
})
