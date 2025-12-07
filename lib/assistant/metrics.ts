import { logger } from './logger'

export type MetricType = 'counter' | 'gauge' | 'histogram'

export interface Metric {
  name: string
  type: MetricType
  value: number
  labels?: Record<string, string>
  timestamp?: Date
}

class MetricsCollector {
  private metrics: Map<string, Metric> = new Map()
  private readonly flushInterval: number = 60000 // 1 minute

  constructor() {
    if (typeof window === 'undefined') {
      // Only start interval on server
      setInterval(() => this.flush(), this.flushInterval)
    }
  }

  // Counter: Monotonically increasing value
  incrementCounter(name: string, labels?: Record<string, string>, value: number = 1) {
    const key = this.getKey(name, labels)
    const existing = this.metrics.get(key)

    if (existing) {
      existing.value += value
      existing.timestamp = new Date()
    } else {
      this.metrics.set(key, {
        name,
        type: 'counter',
        value,
        labels,
        timestamp: new Date(),
      })
    }

    logger.debug('Counter incremented', { metric: name, value, labels })
  }

  // Gauge: Can go up or down
  setGauge(name: string, value: number, labels?: Record<string, string>) {
    const key = this.getKey(name, labels)

    this.metrics.set(key, {
      name,
      type: 'gauge',
      value,
      labels,
      timestamp: new Date(),
    })

    logger.debug('Gauge set', { metric: name, value, labels })
  }

  // Histogram: Distribution of values (simplified - stores avg)
  recordHistogram(name: string, value: number, labels?: Record<string, string>) {
    const key = this.getKey(name, labels)
    const existing = this.metrics.get(key)

    if (existing && existing.type === 'histogram') {
      // Simple average calculation
      const count = (existing.labels?.__count ? parseInt(existing.labels.__count) : 0) + 1
      existing.value = (existing.value * (count - 1) + value) / count
      existing.labels = { ...existing.labels, __count: count.toString() }
      existing.timestamp = new Date()
    } else {
      this.metrics.set(key, {
        name,
        type: 'histogram',
        value,
        labels: { ...labels, __count: '1' },
        timestamp: new Date(),
      })
    }

    logger.debug('Histogram recorded', { metric: name, value, labels })
  }

  // Get all metrics
  getMetrics(): Metric[] {
    return Array.from(this.metrics.values())
  }

  // Clear metrics
  clear() {
    this.metrics.clear()
  }

  // Flush metrics (log and optionally send to external service)
  private flush() {
    const metrics = this.getMetrics()

    if (metrics.length > 0) {
      logger.info('Metrics snapshot', {
        metrics: metrics.map((m) => ({
          name: m.name,
          type: m.type,
          value: m.value,
          labels: m.labels,
        })),
        count: metrics.length,
      })

      // In production, send to monitoring service (Prometheus, DataDog, etc.)
      if (process.env.METRICS_ENDPOINT) {
        this.sendToExternalService(metrics).catch((error) => {
          logger.error('Failed to send metrics', { error })
        })
      }
    }
  }

  private async sendToExternalService(metrics: Metric[]) {
    if (!process.env.METRICS_ENDPOINT) return

    try {
      const response = await fetch(process.env.METRICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.METRICS_API_KEY && {
            Authorization: `Bearer ${process.env.METRICS_API_KEY}`,
          }),
        },
        body: JSON.stringify({ metrics, timestamp: new Date().toISOString() }),
      })

      if (!response.ok) {
        throw new Error(`Metrics API returned ${response.status}`)
      }
    } catch (error) {
      logger.error('Failed to send metrics to external service', { error })
    }
  }

  private getKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',')
    return `${name}{${labelStr}}`
  }
}

export const metrics = new MetricsCollector()

// Predefined metric names (for type safety and consistency)
export const MetricNames = {
  // Webhook metrics
  WEBHOOK_REQUESTS_TOTAL: 'webhook_requests_total',
  WEBHOOK_ERRORS_TOTAL: 'webhook_errors_total',
  WEBHOOK_DURATION_MS: 'webhook_duration_ms',
  WEBHOOK_RATE_LIMIT_EXCEEDED: 'webhook_rate_limit_exceeded_total',

  // Transaction metrics
  TRANSACTIONS_CREATED_TOTAL: 'transactions_created_total',
  TRANSACTIONS_FAILED_TOTAL: 'transactions_failed_total',
  TRANSACTION_AMOUNT_TOTAL: 'transaction_amount_total',

  // Reminder metrics
  REMINDERS_SCHEDULED_TOTAL: 'reminders_scheduled_total',
  REMINDERS_SENT_TOTAL: 'reminders_sent_total',
  REMINDERS_FAILED_TOTAL: 'reminders_failed_total',

  // AI metrics
  AI_INSIGHTS_GENERATED_TOTAL: 'ai_insights_generated_total',
  AI_INSIGHTS_FAILED_TOTAL: 'ai_insights_failed_total',
  AI_RESPONSE_TIME_MS: 'ai_response_time_ms',

  // Job queue metrics
  JOBS_QUEUED_TOTAL: 'jobs_queued_total',
  JOBS_COMPLETED_TOTAL: 'jobs_completed_total',
  JOBS_FAILED_TOTAL: 'jobs_failed_total',
  JOB_DURATION_MS: 'job_duration_ms',

  // Media processing metrics
  MEDIA_DOWNLOADS_TOTAL: 'media_downloads_total',
  MEDIA_DOWNLOAD_ERRORS_TOTAL: 'media_download_errors_total',
  MEDIA_DOWNLOAD_RETRIES_TOTAL: 'media_download_retries_total',

  // User metrics
  ACTIVE_USERS_TOTAL: 'active_users_total',
  NEW_USERS_TOTAL: 'new_users_total',
} as const
