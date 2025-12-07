import { z } from "zod"

const InboundMessageSchema = z.object({
  from: z.string().min(10),
  body: z.string().optional(),
  type: z.enum(["TEXT", "IMAGE", "AUDIO", "DOCUMENT", "text", "image", "audio", "document"]).optional(),
  media: z
    .object({
      url: z.string().url().optional(),
      mimetype: z.string().optional(),
      filename: z.string().optional(),
    })
    .optional(),
  messageId: z.string().optional(),
  timestamp: z.number().optional(),
})

const EvolutionPayloadSchema = z.object({
  event: z.string(),
  instance: z.string().optional(),
  data: z.object({
    key: z.object({
      remoteJid: z.string(),
      fromMe: z.boolean().optional(),
      id: z.string(),
    }),
    message: z.any(),
    messageTimestamp: z.union([z.string(), z.number()]).optional(),
  }),
})

export type ValidatedInboundMessage = z.infer<typeof InboundMessageSchema>
export type ValidatedEvolutionPayload = z.infer<typeof EvolutionPayloadSchema>

export class WebhookValidationError extends Error {
  constructor(
    message: string,
    public errors?: z.ZodError
  ) {
    super(message)
    this.name = "WebhookValidationError"
  }
}

export class WebhookValidator {
  validateInboundMessage(data: unknown): ValidatedInboundMessage {
    const result = InboundMessageSchema.safeParse(data)

    if (!result.success) {
      throw new WebhookValidationError("Invalid inbound message format", result.error)
    }

    return result.data
  }

  validateEvolutionPayload(data: unknown): ValidatedEvolutionPayload {
    const result = EvolutionPayloadSchema.safeParse(data)

    if (!result.success) {
      throw new WebhookValidationError("Invalid Evolution API payload", result.error)
    }

    return result.data
  }

  validateMediaUrl(url: string): void {
    try {
      const parsed = new URL(url)
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new WebhookValidationError("Invalid media URL protocol")
      }
    } catch {
      throw new WebhookValidationError("Invalid media URL format")
    }
  }

  validateAmount(amount: number): void {
    if (amount <= 0) {
      throw new WebhookValidationError("Amount must be greater than zero")
    }

    if (amount > 1000000) {
      throw new WebhookValidationError("Amount exceeds maximum allowed value")
    }

    if (!Number.isFinite(amount)) {
      throw new WebhookValidationError("Amount must be a valid number")
    }
  }

  validatePhone(phone: string): void {
    const normalized = phone.replace(/\D/g, "")

    if (normalized.length < 10 || normalized.length > 15) {
      throw new WebhookValidationError("Invalid phone number format")
    }
  }
}

export const webhookValidator = new WebhookValidator()
