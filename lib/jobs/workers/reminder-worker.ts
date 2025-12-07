import { Worker, Job } from "bullmq"
import { Redis } from "ioredis"
import { ReminderJobData } from "../queue"
import { prisma } from "@/lib/prisma"
import { sendWhatsAppMessage } from "@/lib/assistant/dispatcher"

const connection = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  : undefined

export class ReminderWorker {
  private worker: Worker<ReminderJobData> | null = null

  start(): void {
    if (!connection) {
      console.warn("Redis not available, reminder worker disabled")
      return
    }

    this.worker = new Worker<ReminderJobData>(
      "reminders",
      async (job: Job<ReminderJobData>) => {
        return this.processReminderJob(job)
      },
      {
        connection,
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 1000,
        },
      }
    )

    this.worker.on("completed", (job) => {
      console.log(`Reminder job ${job.id} completed`)
    })

    this.worker.on("failed", (job, error) => {
      console.error(`Reminder job ${job?.id} failed:`, error)
    })

    this.worker.on("error", (error) => {
      console.error("Reminder worker error:", error)
    })

    console.log("Reminder worker started")
  }

  private async processReminderJob(job: Job<ReminderJobData>): Promise<void> {
    const { reminderId, userId, phone, text } = job.data

    const reminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
    })

    if (!reminder) {
      throw new Error(`Reminder ${reminderId} not found`)
    }

    if (reminder.status !== "PENDING") {
      console.log(`Reminder ${reminderId} already processed, skipping`)
      return
    }

    try {
      await sendWhatsAppMessage(phone, `🔔 *Lembrete*\n\n${text}`)

      await prisma.reminder.update({
        where: { id: reminderId },
        data: { status: "SENT" },
      })

      console.log(`Reminder ${reminderId} sent successfully`)
    } catch (error) {
      console.error(`Failed to send reminder ${reminderId}:`, error)

      await prisma.reminder.update({
        where: { id: reminderId },
        data: { status: "PENDING" },
      })

      throw error
    }
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close()
      console.log("Reminder worker stopped")
    }
  }
}

export const reminderWorker = new ReminderWorker()
