import { PrismaReminderRepo, PrismaUserRepo } from '../../assistant/repositories'
import { parseDateRelative } from '../nlu'
import { jobQueue } from '@/lib/jobs/queue'
import { logger } from '../logger'
import { metrics, MetricNames } from '../metrics'

export class ScheduleReminder {
  constructor(private readonly users = new PrismaUserRepo(), private readonly repo = new PrismaReminderRepo()) {}

  async execute(input: { phone: string; text: string }) {
    return logger.measureTime(
      'schedule_reminder',
      async () => {
        try {
          const { id: userId } = await this.users.getOrCreateByPhone(input.phone)
          const when = parseDateRelative(input.text)

          if (!when) {
            logger.logParseError({
              userId,
              phone: input.phone,
              intent: 'reminder',
              error: 'Failed to parse date from text',
            })
            metrics.incrementCounter(MetricNames.REMINDERS_FAILED_TOTAL, { reason: 'parse_error' })
            return { ok: false as const, message: 'Não entendi a data/hora. Ex.: lembrar amanhã 9h pagar conta' }
          }

          const text = input.text.replace(/lembrar/i, '').trim()
          const reminder = await this.repo.create({ userId, text, when })
          const reminderId = reminder

          logger.logReminderScheduled({
            userId,
            reminderId,
            phone: input.phone,
            scheduledFor: when.toISOString(),
          })

          metrics.incrementCounter(MetricNames.REMINDERS_SCHEDULED_TOTAL, { userId })

          try {
            await jobQueue.addReminderJob(
              {
                reminderId,
                userId,
                phone: input.phone,
                text,
              },
              when
            )
            metrics.incrementCounter(MetricNames.JOBS_QUEUED_TOTAL, { jobType: 'reminder' })
          } catch (error) {
            logger.error('Failed to schedule reminder job', {
              error,
              userId,
              reminderId,
            })
            metrics.incrementCounter(MetricNames.JOBS_FAILED_TOTAL, { jobType: 'reminder' })
          }

          return { ok: true as const, message: 'Lembrete agendado.' }
        } catch (error) {
          logger.error('Reminder scheduling failed', {
            error,
            phone: input.phone,
          })
          metrics.incrementCounter(MetricNames.REMINDERS_FAILED_TOTAL, { reason: 'unknown_error' })
          throw error
        }
      },
      { phone: input.phone }
    )
  }
}

