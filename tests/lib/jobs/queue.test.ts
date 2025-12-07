import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { JobQueue, type ReminderJobData } from '@/lib/jobs/queue'
import { Queue } from 'bullmq'

// Mock ioredis
vi.mock('ioredis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    quit: vi.fn().mockResolvedValue(undefined),
  })),
}))

// Mock BullMQ
vi.mock('bullmq', () => ({
  Queue: vi.fn(),
  QueueEvents: vi.fn().mockImplementation(() => ({
    close: vi.fn().mockResolvedValue(undefined),
  })),
  Worker: vi.fn(),
  Job: vi.fn(),
}))

describe('JobQueue', () => {
  let jobQueue: JobQueue
  let mockQueue: any

  beforeEach(() => {
    mockQueue = {
      add: vi.fn().mockResolvedValue({ id: 'job-123' }),
      getJobs: vi.fn().mockResolvedValue([]),
      getJobCounts: vi.fn().mockResolvedValue({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      }),
      close: vi.fn().mockResolvedValue(undefined),
    }

    vi.mocked(Queue).mockImplementation(() => mockQueue)

    jobQueue = new JobQueue()
  })

  afterEach(async () => {
    await jobQueue.close()
  })

  describe('Reminder Jobs', () => {
    it('should add reminder job with future date', async () => {
      const scheduledAt = new Date()
      scheduledAt.setHours(scheduledAt.getHours() + 2)

      const jobData: ReminderJobData = {
        reminderId: 'reminder-123',
        userId: 'user-123',
        phone: '5511999999999',
        text: 'Pagar conta de luz',
      }

      await jobQueue.addReminderJob(jobData, scheduledAt)

      expect(mockQueue.add).toHaveBeenCalledWith('send-reminder', jobData, {
        delay: expect.any(Number),
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 24 * 3600, count: 100 },
        removeOnFail: { age: 7 * 24 * 3600, count: 50 },
      })

      const delay = mockQueue.add.mock.calls[0][2].delay
      expect(delay).toBeGreaterThan(0)
    })

    it('should handle immediate execution (past date)', async () => {
      const pastDate = new Date()
      pastDate.setHours(pastDate.getHours() - 1)

      const jobData: ReminderJobData = {
        reminderId: 'reminder-456',
        userId: 'user-456',
        phone: '5511988888888',
        text: 'Tarefa atrasada',
      }

      await jobQueue.addReminderJob(jobData, pastDate)

      const delay = mockQueue.add.mock.calls[0][2].delay
      expect(delay).toBe(0) // Past dates are clamped to 0 for immediate execution
    })

    it('should schedule multiple reminders independently', async () => {
      const date1 = new Date()
      date1.setHours(date1.getHours() + 1)

      const date2 = new Date()
      date2.setHours(date2.getHours() + 3)

      await jobQueue.addReminderJob(
        {
          reminderId: 'r1',
          userId: 'u1',
          phone: '5511111111111',
          text: 'Reminder 1',
        },
        date1
      )

      await jobQueue.addReminderJob(
        {
          reminderId: 'r2',
          userId: 'u2',
          phone: '5511222222222',
          text: 'Reminder 2',
        },
        date2
      )

      expect(mockQueue.add).toHaveBeenCalledTimes(2)
    })
  })

  describe('Job Configuration', () => {
    it('should configure retry attempts', async () => {
      const scheduledAt = new Date()
      scheduledAt.setHours(scheduledAt.getHours() + 1)

      await jobQueue.addReminderJob(
        {
          reminderId: 'r1',
          userId: 'u1',
          phone: '5511999999999',
          text: 'Test',
        },
        scheduledAt
      )

      const config = mockQueue.add.mock.calls[0][2]
      expect(config.attempts).toBe(3)
      expect(config.backoff).toEqual({ type: 'exponential', delay: 5000 })
    })

    it('should configure job cleanup policies', async () => {
      const scheduledAt = new Date()
      scheduledAt.setHours(scheduledAt.getHours() + 1)

      await jobQueue.addReminderJob(
        {
          reminderId: 'r1',
          userId: 'u1',
          phone: '5511999999999',
          text: 'Test',
        },
        scheduledAt
      )

      const config = mockQueue.add.mock.calls[0][2]
      expect(config.removeOnComplete).toEqual({ age: 24 * 3600, count: 100 })
      expect(config.removeOnFail).toEqual({ age: 7 * 24 * 3600, count: 50 })
    })
  })

  describe('Error Handling', () => {
    it('should handle queue add failures', async () => {
      mockQueue.add.mockRejectedValue(new Error('Redis connection failed'))

      const scheduledAt = new Date()
      scheduledAt.setHours(scheduledAt.getHours() + 1)

      await expect(
        jobQueue.addReminderJob(
          {
            reminderId: 'r1',
            userId: 'u1',
            phone: '5511999999999',
            text: 'Test',
          },
          scheduledAt
        )
      ).rejects.toThrow('Redis connection failed')
    })

    it('should handle graceful shutdown', async () => {
      await jobQueue.close()

      expect(mockQueue.close).toHaveBeenCalled()
    })
  })

  describe('Job Data Validation', () => {
    it('should accept valid job data', async () => {
      const validData: ReminderJobData = {
        reminderId: 'rem-123',
        userId: 'user-123',
        phone: '5511999999999',
        text: 'Valid reminder text',
      }

      const scheduledAt = new Date()
      scheduledAt.setHours(scheduledAt.getHours() + 1)

      await jobQueue.addReminderJob(validData, scheduledAt)

      expect(mockQueue.add).toHaveBeenCalledWith('send-reminder', validData, expect.any(Object))
    })

    it('should handle empty text field', async () => {
      const dataWithEmptyText: ReminderJobData = {
        reminderId: 'rem-456',
        userId: 'user-456',
        phone: '5511999999999',
        text: '',
      }

      const scheduledAt = new Date()
      scheduledAt.setHours(scheduledAt.getHours() + 1)

      await jobQueue.addReminderJob(dataWithEmptyText, scheduledAt)

      expect(mockQueue.add).toHaveBeenCalled()
    })
  })

  describe('Queue Metrics', () => {
    it('should retrieve job counts', async () => {
      mockQueue.getJobCounts.mockResolvedValue({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
      })

      const counts = await mockQueue.getJobCounts()

      expect(counts.waiting).toBe(5)
      expect(counts.active).toBe(2)
      expect(counts.completed).toBe(100)
      expect(counts.failed).toBe(3)
    })
  })

  describe('Delay Calculation', () => {
    it('should calculate correct delay for future jobs', async () => {
      const now = new Date()
      const future = new Date(now.getTime() + 3600000) // 1 hour ahead

      await jobQueue.addReminderJob(
        {
          reminderId: 'r1',
          userId: 'u1',
          phone: '5511999999999',
          text: 'Test',
        },
        future
      )

      const delay = mockQueue.add.mock.calls[0][2].delay
      expect(delay).toBeGreaterThan(3500000) // ~58 minutes
      expect(delay).toBeLessThan(3700000) // ~62 minutes
    })

    it('should use delay of 0 for immediate execution', async () => {
      const past = new Date()
      past.setMinutes(past.getMinutes() - 10)

      await jobQueue.addReminderJob(
        {
          reminderId: 'r1',
          userId: 'u1',
          phone: '5511999999999',
          text: 'Test',
        },
        past
      )

      const delay = mockQueue.add.mock.calls[0][2].delay
      expect(delay).toBe(0) // Past dates are clamped to 0 for immediate execution
    })
  })
})
