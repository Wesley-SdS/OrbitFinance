import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { WebhookSecurity, WebhookSecurityError } from '@/lib/assistant/webhook-security'
import { WebhookRateLimiter, RateLimitExceededError } from '@/lib/assistant/webhook-rate-limit'
import { WebhookValidator, WebhookValidationError } from '@/lib/assistant/webhook-validator'
import { NextRequest } from 'next/server'

describe('WebhookSecurity', () => {
  let security: WebhookSecurity

  beforeEach(() => {
    security = new WebhookSecurity({
      requireToken: true,
      expectedToken: 'test-token-123',
      verifySignature: true,
      signatureSecret: 'test-secret',
    })
  })

  describe('Token Verification', () => {
    it('should accept valid token with signature', () => {
      const body = JSON.stringify({ test: 'data' })
      const signature = security.generateSignature(body, 'test-secret')

      const request = new NextRequest('http://localhost:3000/api/webhook', {
        headers: {
          Authorization: 'Bearer test-token-123',
          'x-signature': signature
        },
      })

      expect(() => security.verifyRequest(request, body)).not.toThrow()
    })

    it('should reject missing token', () => {
      const request = new NextRequest('http://localhost:3000/api/webhook')

      expect(() => security.verifyRequest(request, '{}')).toThrow(WebhookSecurityError)
      expect(() => security.verifyRequest(request, '{}')).toThrow('Missing authentication token')
    })

    it('should reject invalid token', () => {
      const request = new NextRequest('http://localhost:3000/api/webhook', {
        headers: { Authorization: 'Bearer wrong-token' },
      })

      expect(() => security.verifyRequest(request, '{}')).toThrow(WebhookSecurityError)
      expect(() => security.verifyRequest(request, '{}')).toThrow('Invalid authentication token')
    })
  })

  describe('Signature Verification', () => {
    it('should accept valid HMAC signature', () => {
      const body = JSON.stringify({ test: 'data' })
      const signature = security.generateSignature(body, 'test-secret')

      const request = new NextRequest('http://localhost:3000/api/webhook', {
        headers: {
          Authorization: 'Bearer test-token-123',
          'x-signature': signature,
        },
      })

      expect(() => security.verifyRequest(request, body)).not.toThrow()
    })

    it('should reject missing signature', () => {
      const request = new NextRequest('http://localhost:3000/api/webhook', {
        headers: { Authorization: 'Bearer test-token-123' },
      })

      expect(() => security.verifyRequest(request, '{}')).toThrow(WebhookSecurityError)
      expect(() => security.verifyRequest(request, '{}')).toThrow('Missing webhook signature')
    })

    it('should reject invalid signature', () => {
      const request = new NextRequest('http://localhost:3000/api/webhook', {
        headers: {
          Authorization: 'Bearer test-token-123',
          'x-signature': 'invalid-signature',
        },
      })

      expect(() => security.verifyRequest(request, '{}')).toThrow(WebhookSecurityError)
      expect(() => security.verifyRequest(request, '{}')).toThrow('Invalid webhook signature')
    })

    it('should accept x-hub-signature-256 header', () => {
      const body = JSON.stringify({ test: 'data' })
      const signature = security.generateSignature(body, 'test-secret')

      const request = new NextRequest('http://localhost:3000/api/webhook', {
        headers: {
          Authorization: 'Bearer test-token-123',
          'x-hub-signature-256': signature,
        },
      })

      expect(() => security.verifyRequest(request, body)).not.toThrow()
    })
  })

  describe('Configuration', () => {
    it('should work with token-only mode', () => {
      const tokenOnly = new WebhookSecurity({
        requireToken: true,
        expectedToken: 'test-token',
        verifySignature: false,
      })

      const request = new NextRequest('http://localhost:3000/api/webhook', {
        headers: { Authorization: 'Bearer test-token' },
      })

      expect(() => tokenOnly.verifyRequest(request, '{}')).not.toThrow()
    })

    it('should work with signature-only mode', () => {
      const signatureOnly = new WebhookSecurity({
        requireToken: false,
        verifySignature: true,
        signatureSecret: 'test-secret',
      })

      const body = '{}'
      const signature = signatureOnly.generateSignature(body, 'test-secret')

      const request = new NextRequest('http://localhost:3000/api/webhook', {
        headers: { 'x-signature': signature },
      })

      expect(() => signatureOnly.verifyRequest(request, body)).not.toThrow()
    })
  })
})

describe('WebhookRateLimiter', () => {
  let rateLimiter: WebhookRateLimiter
  let mockRedis: any

  beforeEach(() => {
    // Mock Redis for tests
    mockRedis = {
      connect: vi.fn().mockResolvedValue(undefined),
      pipeline: vi.fn().mockReturnValue({
        zremrangebyscore: vi.fn().mockReturnThis(),
        zadd: vi.fn().mockReturnThis(),
        zcount: vi.fn().mockReturnThis(),
        expire: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([[null, 0], [null, 1], [null, 1], [null, 1]]),
      }),
      quit: vi.fn().mockResolvedValue(undefined),
    }

    // Set Redis URL to enable rate limiting
    process.env.REDIS_URL = 'redis://localhost:6379'

    rateLimiter = new WebhookRateLimiter({
      maxRequests: 5,
      windowMs: 60000, // 1 minute
    })

    // Replace redis instance with mock
    ;(rateLimiter as any).redis = mockRedis
  })

  afterEach(() => {
    delete process.env.REDIS_URL
  })

  it('should allow requests within limit', async () => {
    const identifier = 'test-user-1'

    for (let i = 0; i < 5; i++) {
      await rateLimiter.checkLimit(identifier)
    }

    expect(mockRedis.pipeline).toHaveBeenCalled()
  })

  it('should block requests exceeding limit', async () => {
    const identifier = 'test-user-2'

    // Mock count > maxRequests
    mockRedis.pipeline.mockReturnValue({
      zremrangebyscore: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      zcount: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([[null, 0], [null, 1], [null, 6], [null, 1]]),
    })

    await expect(rateLimiter.checkLimit(identifier)).rejects.toThrow(RateLimitExceededError)
  })

  it('should provide retry-after header value', async () => {
    const identifier = 'test-user-3'

    // Mock count > maxRequests
    mockRedis.pipeline.mockReturnValue({
      zremrangebyscore: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      zcount: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([[null, 0], [null, 1], [null, 10], [null, 1]]),
    })

    try {
      await rateLimiter.checkLimit(identifier)
      throw new Error('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitExceededError)
      expect((error as RateLimitExceededError).retryAfter).toBeGreaterThan(0)
    }
  })

  it('should isolate limits per identifier', async () => {
    const user1 = 'test-user-4'
    const user2 = 'test-user-5'

    // Mock user1 exceeds limit
    mockRedis.pipeline.mockReturnValue({
      zremrangebyscore: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      zcount: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([[null, 0], [null, 1], [null, 6], [null, 1]]),
    })

    await expect(rateLimiter.checkLimit(user1)).rejects.toThrow(RateLimitExceededError)

    // Mock user2 within limit
    mockRedis.pipeline.mockReturnValue({
      zremrangebyscore: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      zcount: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([[null, 0], [null, 1], [null, 1], [null, 1]]),
    })

    await rateLimiter.checkLimit(user2)
    expect(mockRedis.pipeline).toHaveBeenCalled()
  })

  it('should gracefully handle Redis unavailable', async () => {
    const noRedisLimiter = new WebhookRateLimiter({
      maxRequests: 5,
      windowMs: 60000,
    })
    ;(noRedisLimiter as any).redis = null

    await noRedisLimiter.checkLimit('test-user')
    // Should not throw
  })
})

describe('WebhookValidator', () => {
  let validator: WebhookValidator

  beforeEach(() => {
    validator = new WebhookValidator()
  })

  describe('Inbound Message Validation', () => {
    it('should validate correct inbound message', () => {
      const data = {
        from: '5511999999999',
        body: 'gastei 50 reais',
        type: 'text',
      }

      const result = validator.validateInboundMessage(data)
      expect(result.from).toBe('5511999999999')
      expect(result.body).toBe('gastei 50 reais')
    })

    it('should reject message with short phone number', () => {
      const data = {
        from: '123',
        body: 'test',
      }

      expect(() => validator.validateInboundMessage(data)).toThrow(WebhookValidationError)
    })

    it('should accept message with media', () => {
      const data = {
        from: '5511999999999',
        type: 'image',
        media: {
          url: 'https://example.com/image.jpg',
          mimetype: 'image/jpeg',
        },
      }

      const result = validator.validateInboundMessage(data)
      expect(result.type).toBe('image')
      expect(result.media?.url).toBe('https://example.com/image.jpg')
    })

    it('should allow optional fields to be missing', () => {
      const data = {
        from: '5511999999999',
      }

      const result = validator.validateInboundMessage(data)
      expect(result.from).toBe('5511999999999')
      expect(result.body).toBeUndefined()
    })
  })

  describe('Evolution Payload Validation', () => {
    it('should validate correct Evolution payload', () => {
      const data = {
        event: 'messages.upsert',
        instance: 'test-instance',
        data: {
          key: {
            remoteJid: '5511999999999@s.whatsapp.net',
            fromMe: false,
            id: 'ABC123',
          },
          message: {
            conversation: 'gastei 50 reais',
          },
        },
      }

      const result = validator.validateEvolutionPayload(data)
      expect(result.event).toBe('messages.upsert')
      expect(result.data.key.remoteJid).toBe('5511999999999@s.whatsapp.net')
    })

    it('should reject payload without required fields', () => {
      const data = {
        event: 'messages.upsert',
        data: {
          key: {
            // Missing remoteJid
            id: 'ABC123',
          },
        },
      }

      expect(() => validator.validateEvolutionPayload(data)).toThrow(WebhookValidationError)
    })
  })

  describe('Media URL Validation', () => {
    it('should accept valid HTTPS URL', () => {
      expect(() => validator.validateMediaUrl('https://example.com/image.jpg')).not.toThrow()
    })

    it('should accept valid HTTP URL', () => {
      expect(() => validator.validateMediaUrl('http://example.com/image.jpg')).not.toThrow()
    })

    it('should reject non-HTTP protocols', () => {
      expect(() => validator.validateMediaUrl('ftp://example.com/file')).toThrow(
        WebhookValidationError
      )
    })

    it('should reject invalid URL format', () => {
      expect(() => validator.validateMediaUrl('not-a-url')).toThrow(WebhookValidationError)
    })
  })

  describe('Amount Validation', () => {
    it('should accept valid positive amounts', () => {
      expect(() => validator.validateAmount(50.0)).not.toThrow()
      expect(() => validator.validateAmount(0.01)).not.toThrow()
      expect(() => validator.validateAmount(999999.99)).not.toThrow()
    })

    it('should reject zero amount', () => {
      expect(() => validator.validateAmount(0)).toThrow(WebhookValidationError)
    })

    it('should reject negative amounts', () => {
      expect(() => validator.validateAmount(-10)).toThrow(WebhookValidationError)
    })

    it('should reject amounts exceeding maximum', () => {
      expect(() => validator.validateAmount(1000001)).toThrow(WebhookValidationError)
    })

    it('should reject non-finite amounts', () => {
      expect(() => validator.validateAmount(Infinity)).toThrow(WebhookValidationError)
      expect(() => validator.validateAmount(NaN)).toThrow(WebhookValidationError)
    })
  })

  describe('Phone Validation', () => {
    it('should accept valid phone numbers', () => {
      expect(() => validator.validatePhone('5511999999999')).not.toThrow()
      expect(() => validator.validatePhone('+55 11 99999-9999')).not.toThrow()
      expect(() => validator.validatePhone('(11) 99999-9999')).not.toThrow()
    })

    it('should reject short phone numbers', () => {
      expect(() => validator.validatePhone('123')).toThrow(WebhookValidationError)
    })

    it('should reject long phone numbers', () => {
      expect(() => validator.validatePhone('12345678901234567890')).toThrow(WebhookValidationError)
    })
  })
})
