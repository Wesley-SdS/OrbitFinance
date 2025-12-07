import { isRetryableError, logError } from "./errors"

export interface RetryOptions {
  maxAttempts: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
  timeout?: number
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  timeout: 30000,
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  context: string,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: unknown

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      if (opts.timeout) {
        return await withTimeout(fn(), opts.timeout, `${context} timeout`)
      }
      return await fn()
    } catch (error) {
      lastError = error

      if (!isRetryableError(error)) {
        throw error
      }

      if (attempt === opts.maxAttempts) {
        logError(context, error, { attempt, maxAttempts: opts.maxAttempts })
        throw error
      }

      const delay = Math.min(opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1), opts.maxDelay)

      logError(context, error, {
        attempt,
        maxAttempts: opts.maxAttempts,
        retryingIn: delay,
      })

      await sleep(delay)
    }
  }

  throw lastError
}

export async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms)
  })

  return Promise.race([promise, timeout])
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function downloadWithRetry(url: string, authToken?: string): Promise<Buffer> {
  return withRetry(
    async () => {
      const headers: Record<string, string> = {}
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`
      }

      const response = await fetch(url, { headers })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const buffer = await response.arrayBuffer()
      return Buffer.from(buffer)
    },
    `Download from ${url}`,
    {
      maxAttempts: 3,
      timeout: 30000,
    }
  )
}
