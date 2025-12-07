import crypto from "crypto"
import { NextRequest } from "next/server"

export class WebhookSecurityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "WebhookSecurityError"
  }
}

export interface WebhookSecurityConfig {
  verifySignature: boolean
  requireToken: boolean
  expectedToken?: string
  signatureSecret?: string
}

export class WebhookSecurity {
  constructor(private config: WebhookSecurityConfig) {}

  verifyRequest(request: NextRequest, body: string): void {
    if (this.config.requireToken) {
      this.verifyToken(request)
    }

    if (this.config.verifySignature && this.config.signatureSecret) {
      this.verifySignature(request, body)
    }
  }

  private verifyToken(request: NextRequest): void {
    const authHeader = request.headers.get("authorization")
    const tokenFromQuery = request.nextUrl.searchParams.get("token")
    const token = authHeader?.replace("Bearer ", "") || tokenFromQuery

    if (!token) {
      throw new WebhookSecurityError("Missing authentication token")
    }

    if (this.config.expectedToken && token !== this.config.expectedToken) {
      throw new WebhookSecurityError("Invalid authentication token")
    }
  }

  private verifySignature(request: NextRequest, body: string): void {
    const signature = request.headers.get("x-signature") || request.headers.get("x-hub-signature-256")

    if (!signature) {
      throw new WebhookSecurityError("Missing webhook signature")
    }

    if (!this.config.signatureSecret) {
      throw new WebhookSecurityError("Signature secret not configured")
    }

    const expectedSignature = this.generateSignature(body, this.config.signatureSecret)

    if (!this.constantTimeCompare(signature, expectedSignature)) {
      throw new WebhookSecurityError("Invalid webhook signature")
    }
  }

  // Made public for testing purposes
  generateSignature(payload: string, secret: string): string {
    return `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`
  }

  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }
}

export function createWebhookSecurity(): WebhookSecurity {
  const config: WebhookSecurityConfig = {
    verifySignature: process.env.WA_VERIFY_SIGNATURE === "true",
    requireToken: process.env.WA_REQUIRE_TOKEN === "true",
    expectedToken: process.env.WA_WEBHOOK_TOKEN,
    signatureSecret: process.env.WA_SIGNATURE_SECRET,
  }

  return new WebhookSecurity(config)
}
