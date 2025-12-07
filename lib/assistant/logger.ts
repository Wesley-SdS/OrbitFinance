import pino from 'pino'

export type LogContext = {
  userId?: string
  phone?: string
  intent?: string
  transactionId?: string
  reminderId?: string
  error?: Error | unknown
  duration?: number
  [key: string]: unknown
}

class Logger {
  private logger: pino.Logger

  constructor() {
    const isDevelopment = process.env.NODE_ENV === 'development'

    this.logger = pino({
      level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
      formatters: {
        level: (label) => {
          return { level: label }
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      ...(isDevelopment && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'HH:MM:ss.l',
          },
        },
      }),
    })
  }

  info(message: string, context?: LogContext) {
    this.logger.info(context, message)
  }

  error(message: string, context?: LogContext) {
    const errorContext = context?.error
      ? {
          ...context,
          error: {
            message: context.error instanceof Error ? context.error.message : String(context.error),
            stack: context.error instanceof Error ? context.error.stack : undefined,
            name: context.error instanceof Error ? context.error.name : undefined,
          },
        }
      : context

    this.logger.error(errorContext, message)
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(context, message)
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(context, message)
  }

  // Specialized logging methods for common operations
  logWebhookReceived(context: LogContext) {
    this.info('Webhook received', {
      ...context,
      event: 'webhook_received',
    })
  }

  logTransactionCreated(context: LogContext) {
    this.info('Transaction created', {
      ...context,
      event: 'transaction_created',
    })
  }

  logReminderScheduled(context: LogContext) {
    this.info('Reminder scheduled', {
      ...context,
      event: 'reminder_scheduled',
    })
  }

  logReminderSent(context: LogContext) {
    this.info('Reminder sent', {
      ...context,
      event: 'reminder_sent',
    })
  }

  logAIInsightGenerated(context: LogContext) {
    this.info('AI insight generated', {
      ...context,
      event: 'ai_insight_generated',
    })
  }

  logRateLimitExceeded(context: LogContext) {
    this.warn('Rate limit exceeded', {
      ...context,
      event: 'rate_limit_exceeded',
    })
  }

  logAuthenticationFailed(context: LogContext) {
    this.warn('Authentication failed', {
      ...context,
      event: 'authentication_failed',
    })
  }

  logParseError(context: LogContext) {
    this.warn('Parse error', {
      ...context,
      event: 'parse_error',
    })
  }

  logRetryAttempt(context: LogContext) {
    this.debug('Retry attempt', {
      ...context,
      event: 'retry_attempt',
    })
  }

  // Performance logging
  measureTime<T>(operation: string, fn: () => T | Promise<T>, context?: LogContext): T | Promise<T> {
    const start = Date.now()
    const result = fn()

    if (result instanceof Promise) {
      return result
        .then((value) => {
          const duration = Date.now() - start
          this.debug(`Operation completed: ${operation}`, {
            ...context,
            duration,
            operation,
          })
          return value
        })
        .catch((error) => {
          const duration = Date.now() - start
          this.error(`Operation failed: ${operation}`, {
            ...context,
            duration,
            operation,
            error,
          })
          throw error
        })
    } else {
      const duration = Date.now() - start
      this.debug(`Operation completed: ${operation}`, {
        ...context,
        duration,
        operation,
      })
      return result
    }
  }
}

export const logger = new Logger()
