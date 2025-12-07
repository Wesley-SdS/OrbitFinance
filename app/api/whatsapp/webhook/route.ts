import { NextRequest, NextResponse } from 'next/server'
import { InboundRouter } from '../../../../lib/assistant/inbound'
import { createWebhookSecurity, WebhookSecurityError } from '@/lib/assistant/webhook-security'
import { WebhookRateLimiter, RateLimitExceededError } from '@/lib/assistant/webhook-rate-limit'
import { WebhookValidator, WebhookValidationError } from '@/lib/assistant/webhook-validator'

export const dynamic = 'force-dynamic'

// Initialize security components
const security = createWebhookSecurity()
const rateLimiter = new WebhookRateLimiter({
  maxRequests: 100, // 100 requests
  windowMs: 60000,  // per minute
})
const validator = new WebhookValidator()

export async function GET() {
  return NextResponse.json({ ok: true, status: 'healthy' })
}

export async function POST(req: NextRequest) {
  let bodyText = ''

  try {
    // 1. Read raw body for signature verification
    bodyText = await req.text()

    // 2. Security: Verify webhook signature and token (if enabled)
    try {
      security.verifyRequest(req, bodyText)
    } catch (securityError) {
      if (securityError instanceof WebhookSecurityError) {
        console.warn('🔒 Security check failed:', securityError.message)
        return NextResponse.json(
          { error: 'Unauthorized', details: securityError.message },
          { status: 401 }
        )
      }
      throw securityError
    }

    // 3. Parse JSON body
    const body = JSON.parse(bodyText)

    // 4. Validate payload structure
    try {
      validator.validateInboundMessage(body)
    } catch (validationError) {
      if (validationError instanceof WebhookValidationError) {
        console.warn('⚠️ Validation failed:', validationError.message)
        return NextResponse.json(
          { error: 'Bad Request', details: validationError.message },
          { status: 400 }
        )
      }
      throw validationError
    }

    // 5. Rate limiting: Check per phone number
    const identifier = body.from || req.headers.get('x-forwarded-for') || 'anonymous'
    try {
      await rateLimiter.checkLimit(identifier)
    } catch (rateLimitError) {
      if (rateLimitError instanceof RateLimitExceededError) {
        console.warn('🚫 Rate limit exceeded for:', identifier)
        return NextResponse.json(
          { error: 'Too Many Requests', details: rateLimitError.message },
          {
            status: 429,
            headers: {
              'Retry-After': rateLimitError.retryAfter.toString(),
              'X-RateLimit-Limit': '100',
              'X-RateLimit-Remaining': '0',
            }
          }
        )
      }
      throw rateLimitError
    }

    // 6. Log the incoming request for debugging
    console.log('📨 Webhook received:', {
      from: body.from,
      text: body.text || body.body,
      type: body.type || 'text'
    })

    // 7. Normalize message format
    const msg = {
      from: body.from,
      text: body.text || body.body,
      type: (body.type || 'TEXT').toUpperCase(), // Normalize to uppercase for database
      id: body.id
    }

    // 8. Process message with InboundRouter
    const router = new InboundRouter()
    const result = await router.handle(msg)

    // 9. Return response
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Webhook processing failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}