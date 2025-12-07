import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Redis from 'ioredis'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: { status: 'unknown' as 'healthy' | 'unhealthy' | 'unknown', latency: 0 },
      redis: { status: 'unknown' as 'healthy' | 'unhealthy' | 'unknown', latency: 0 },
    },
  }

  // Check database
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    checks.checks.database = {
      status: 'healthy',
      latency: Date.now() - start,
    }
  } catch (error) {
    checks.checks.database = {
      status: 'unhealthy',
      latency: 0,
    }
    checks.status = 'unhealthy'
  }

  // Check Redis
  if (process.env.REDIS_URL) {
    const redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    })

    try {
      const start = Date.now()
      await redis.connect()
      await redis.ping()
      checks.checks.redis = {
        status: 'healthy',
        latency: Date.now() - start,
      }
      await redis.quit()
    } catch (error) {
      checks.checks.redis = {
        status: 'unhealthy',
        latency: 0,
      }
      checks.status = 'unhealthy'
    }
  } else {
    checks.checks.redis.status = 'unhealthy'
    checks.status = 'unhealthy'
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503

  return NextResponse.json(checks, { status: statusCode })
}
