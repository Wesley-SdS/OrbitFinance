import { Redis } from "ioredis"

export class RateLimitExceededError extends Error {
  constructor(
    message: string,
    public retryAfter: number
  ) {
    super(message)
    this.name = "RateLimitExceededError"
  }
}

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export class WebhookRateLimiter {
  private redis: Redis | null = null

  constructor(private config: RateLimitConfig) {
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
        lazyConnect: true,
      })
    }
  }

  async checkLimit(identifier: string): Promise<void> {
    if (!this.redis) {
      return
    }

    try {
      await this.redis.connect()
    } catch (error) {
      console.warn("Redis connection failed, skipping rate limit")
      return
    }

    const key = `webhook:ratelimit:${identifier}`
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    try {
      const pipeline = this.redis.pipeline()

      pipeline.zremrangebyscore(key, 0, windowStart)
      pipeline.zadd(key, now, `${now}`)
      pipeline.zcount(key, windowStart, now)
      pipeline.expire(key, Math.ceil(this.config.windowMs / 1000))

      const results = await pipeline.exec()

      if (!results) {
        return
      }

      const count = results[2]?.[1] as number

      if (count > this.config.maxRequests) {
        const retryAfter = Math.ceil(this.config.windowMs / 1000)
        throw new RateLimitExceededError(`Rate limit exceeded for ${identifier}`, retryAfter)
      }
    } catch (error) {
      if (error instanceof RateLimitExceededError) {
        throw error
      }
      console.warn("Rate limit check failed:", error)
    }
  }

  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
    }
  }
}

export function createWebhookRateLimiter(): WebhookRateLimiter {
  return new WebhookRateLimiter({
    maxRequests: 100,
    windowMs: 60000,
  })
}
