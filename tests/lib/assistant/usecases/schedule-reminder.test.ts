import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ScheduleReminder } from '@/lib/assistant/usecases/schedule-reminder'
import { PrismaReminderRepo, PrismaUserRepo } from '@/lib/assistant/repositories'
import { jobQueue } from '@/lib/jobs/queue'

// Mock dependencies
vi.mock('@/lib/assistant/repositories', () => ({
  PrismaReminderRepo: vi.fn(),
  PrismaUserRepo: vi.fn(),
}))

vi.mock('@/lib/jobs/queue', () => ({
  jobQueue: {
    addReminderJob: vi.fn(),
  },
}))

describe('ScheduleReminder', () => {
  let scheduleReminder: ScheduleReminder
  let mockUserRepo: any
  let mockReminderRepo: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockUserRepo = {
      getOrCreateByPhone: vi.fn().mockResolvedValue({ id: 'user-123' }),
    }

    mockReminderRepo = {
      create: vi.fn().mockResolvedValue({
        id: 'reminder-123',
        userId: 'user-123',
        text: 'pagar conta',
        when: new Date('2024-11-15T09:00:00'),
        status: 'PENDING',
      }),
    }

    vi.mocked(PrismaUserRepo).mockImplementation(() => mockUserRepo)
    vi.mocked(PrismaReminderRepo).mockImplementation(() => mockReminderRepo)

    scheduleReminder = new ScheduleReminder()
  })

  describe('Date Parsing', () => {
    it('should schedule reminder for tomorrow', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const result = await scheduleReminder.execute({
        phone: '5511999999999',
        text: 'lembrar amanhã pagar conta',
      })

      expect(result.ok).toBe(true)
      expect(mockReminderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          text: expect.stringContaining('pagar conta'),
        })
      )
    })

    it('should schedule reminder for today', async () => {
      const result = await scheduleReminder.execute({
        phone: '5511999999999',
        text: 'lembrar hoje 15h reunião',
      })

      expect(result.ok).toBe(true)
      expect(mockReminderRepo.create).toHaveBeenCalled()
    })

    it('should schedule reminder for specific date', async () => {
      const result = await scheduleReminder.execute({
        phone: '5511999999999',
        text: 'lembrar 20/11/2024 pagar aluguel',
      })

      expect(result.ok).toBe(true)
      expect(mockReminderRepo.create).toHaveBeenCalled()

      const createCall = mockReminderRepo.create.mock.calls[0][0]
      expect(createCall.when.getDate()).toBe(20)
      expect(createCall.when.getMonth()).toBe(10) // November
    })

    it('should schedule reminder with time', async () => {
      const result = await scheduleReminder.execute({
        phone: '5511999999999',
        text: 'lembrar 20/11/2024 15:30 consulta médica',
      })

      expect(result.ok).toBe(true)

      const createCall = mockReminderRepo.create.mock.calls[0][0]
      expect(createCall.when.getHours()).toBe(15)
      expect(createCall.when.getMinutes()).toBe(30)
    })

    it('should fail when date is not recognized', async () => {
      const result = await scheduleReminder.execute({
        phone: '5511999999999',
        text: 'lembrar algum dia fazer algo',
      })

      expect(result.ok).toBe(false)
      expect(result.message).toContain('Não entendi a data/hora')
    })
  })

  describe('Text Extraction', () => {
    it('should remove "lembrar" keyword from text', async () => {
      await scheduleReminder.execute({
        phone: '5511999999999',
        text: 'lembrar amanhã comprar leite',
      })

      const createCall = mockReminderRepo.create.mock.calls[0][0]
      expect(createCall.text).not.toContain('lembrar')
      expect(createCall.text).toContain('comprar leite')
    })

    it('should handle case insensitive "lembrar"', async () => {
      await scheduleReminder.execute({
        phone: '5511999999999',
        text: 'LEMBRAR amanhã fazer backup',
      })

      const createCall = mockReminderRepo.create.mock.calls[0][0]
      expect(createCall.text.toLowerCase()).not.toContain('lembrar')
    })
  })

  describe('Job Queue Integration', () => {
    it('should schedule job queue task', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0)

      mockReminderRepo.create.mockResolvedValue({
        id: 'reminder-456',
        userId: 'user-123',
        text: 'pagar conta',
        when: tomorrow,
        status: 'PENDING',
      })

      await scheduleReminder.execute({
        phone: '5511999999999',
        text: 'lembrar amanhã 9h pagar conta',
      })

      expect(jobQueue.addReminderJob).toHaveBeenCalledWith(
        expect.objectContaining({
          reminderId: 'reminder-456',
          userId: 'user-123',
          phone: '5511999999999',
          text: expect.stringContaining('pagar conta'),
        }),
        expect.any(Date)
      )
    })

    it('should handle job queue failures gracefully', async () => {
      vi.mocked(jobQueue.addReminderJob).mockRejectedValue(new Error('Redis connection failed'))

      const result = await scheduleReminder.execute({
        phone: '5511999999999',
        text: 'lembrar amanhã testar',
      })

      // Should still return success even if job scheduling fails
      expect(result.ok).toBe(true)
      // Note: Logger.error is called internally but we don't need to test it here
    })
  })

  describe('User Management', () => {
    it('should create user if not exists', async () => {
      mockUserRepo.getOrCreateByPhone.mockResolvedValue({ id: 'new-user-789' })

      await scheduleReminder.execute({
        phone: '5511988888888',
        text: 'lembrar amanhã algo importante',
      })

      expect(mockUserRepo.getOrCreateByPhone).toHaveBeenCalledWith('5511988888888')
      expect(mockReminderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'new-user-789',
        })
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty reminder text', async () => {
      await scheduleReminder.execute({
        phone: '5511999999999',
        text: 'lembrar amanhã',
      })

      const createCall = mockReminderRepo.create.mock.calls[0][0]
      expect(createCall.text).toBeTruthy()
    })

    it('should handle very long reminder text', async () => {
      const longText = 'lembrar amanhã ' + 'a'.repeat(500)

      const result = await scheduleReminder.execute({
        phone: '5511999999999',
        text: longText,
      })

      expect(result.ok).toBe(true)
    })

    it('should handle special characters in text', async () => {
      await scheduleReminder.execute({
        phone: '5511999999999',
        text: 'lembrar amanhã @#$% reunião às 15h',
      })

      const createCall = mockReminderRepo.create.mock.calls[0][0]
      expect(createCall.text).toContain('@#$%')
    })
  })

  describe('Error Handling', () => {
    it('should handle repository errors', async () => {
      mockReminderRepo.create.mockRejectedValue(new Error('Database error'))

      await expect(
        scheduleReminder.execute({
          phone: '5511999999999',
          text: 'lembrar amanhã teste',
        })
      ).rejects.toThrow()
    })

    it('should handle user repository errors', async () => {
      mockUserRepo.getOrCreateByPhone.mockRejectedValue(new Error('User creation failed'))

      await expect(
        scheduleReminder.execute({
          phone: '5511999999999',
          text: 'lembrar amanhã teste',
        })
      ).rejects.toThrow()
    })
  })

  describe('Response Messages', () => {
    it('should return success message in Portuguese', async () => {
      const result = await scheduleReminder.execute({
        phone: '5511999999999',
        text: 'lembrar amanhã algo',
      })

      expect(result.ok).toBe(true)
      expect(result.message).toBe('Lembrete agendado.')
    })

    it('should return error message in Portuguese when date invalid', async () => {
      const result = await scheduleReminder.execute({
        phone: '5511999999999',
        text: 'lembrar sem data',
      })

      expect(result.ok).toBe(false)
      expect(result.message).toContain('Não entendi a data/hora')
      expect(result.message).toContain('Ex.:')
    })
  })
})
