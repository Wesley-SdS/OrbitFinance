import { Redis } from "ioredis"

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379")

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RateLimitError"
  }
}

interface RateLimitOptions {
  interval: number
  uniqueTokenPerInterval?: number
}

interface RateLimiter {
  check: (limit: number, token: string) => Promise<void>
}

export function rateLimit(options: RateLimitOptions): RateLimiter {
  const { interval, uniqueTokenPerInterval = 500 } = options

  return {
    check: async (limit: number, token: string): Promise<void> => {
      const tokenKey = `rate-limit:${token}`
      const now = Date.now()
      const window = now - interval

      const pipeline = redis.pipeline()
      pipeline.zremrangebyscore(tokenKey, 0, window)
      pipeline.zadd(tokenKey, now, `${now}`)
      pipeline.zcard(tokenKey)
      pipeline.expire(tokenKey, Math.ceil(interval / 1000))

      const results = await pipeline.exec()

      if (!results) {
        throw new Error("Redis pipeline failed")
      }

      const count = results[2]?.[1] as number

      if (count > limit) {
        throw new RateLimitError("Rate limit exceeded")
      }
    },
  }
}

export const authLimiter = rateLimit({
  interval: 15 * 60 * 1000,
  uniqueTokenPerInterval: 500,
})

export const apiLimiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
})

export const aiLimiter = rateLimit({
  interval: 60 * 60 * 1000,
  uniqueTokenPerInterval: 100,
})
