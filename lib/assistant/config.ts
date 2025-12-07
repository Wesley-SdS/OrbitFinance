export type MetaWhatsAppConfig = {
  phoneNumberId: string
  accessToken: string
  webhookVerifyToken: string
  webhookUrl: string
}

export function getMetaWhatsAppConfig(): MetaWhatsAppConfig | null {
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN
  const webhookVerifyToken = process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL

  if (!phoneNumberId || !accessToken || !webhookVerifyToken || !webhookUrl) {
    return null
  }

  return {
    phoneNumberId,
    accessToken,
    webhookVerifyToken,
    webhookUrl
  }
}

export type EvolutionConfig = {
  baseUrl: string
  session: string
  token?: string
}

export function getEvolutionConfig(): EvolutionConfig | null {
  const baseUrl = process.env.EVOLUTION_API_URL
  const session = process.env.EVOLUTION_API_SESSION || process.env.WHATSAPP_INSTANCE_NAME
  if (!baseUrl || !session) return null
  const token = process.env.EVOLUTION_API_KEY || process.env.WHATSAPP_ACCESS_TOKEN
  return { baseUrl: baseUrl.replace(/\/$/, ''), session, token: token || undefined }
}

// Check which WhatsApp provider is configured
export function getWhatsAppProvider(): 'meta' | 'evolution' | 'none' {
  if (getMetaWhatsAppConfig()) return 'meta'
  if (getEvolutionConfig()) return 'evolution'
  return 'none'
}

