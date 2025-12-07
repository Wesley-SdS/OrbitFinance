import { Queue, Worker, QueueEvents, Job } from "bullmq"
import { Redis } from "ioredis"

const connection = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  : undefined

export interface ReminderJobData {
  reminderId: string
  userId: string
  phone: string
  text: string
}

export class JobQueue {
  private reminderQueue: Queue<ReminderJobData> | null = null
  private queueEvents: QueueEvents | null = null

  constructor(customConnection?: any) {
    const conn = customConnection ?? connection
    if (conn || process.env.NODE_ENV === 'test') {
      this.reminderQueue = new Queue<ReminderJobData>("reminders", { connection: conn })
      this.queueEvents = conn ? new QueueEvents("reminders", { connection: conn }) : null
    }
  }

  async addReminderJob(data: ReminderJobData, scheduledAt: Date): Promise<void> {
    if (!this.reminderQueue) {
      console.warn("Queue not available, skipping job scheduling")
      return
    }

    const delay = Math.max(0, scheduledAt.getTime() - Date.now())

    await this.reminderQueue.add("send-reminder", data, {
      delay,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: {
        age: 24 * 3600,
        count: 100,
      },
      removeOnFail: {
        age: 7 * 24 * 3600,
        count: 50,
      },
    })
  }

  async getQueueMetrics() {
    if (!this.reminderQueue) {
      return null
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.reminderQueue.getWaitingCount(),
      this.reminderQueue.getActiveCount(),
      this.reminderQueue.getCompletedCount(),
      this.reminderQueue.getFailedCount(),
      this.reminderQueue.getDelayedCount(),
    ])

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    }
  }

  async close(): Promise<void> {
    await this.reminderQueue?.close()
    await this.queueEvents?.close()
    await connection?.quit()
  }
}

export const jobQueue = new JobQueue()
