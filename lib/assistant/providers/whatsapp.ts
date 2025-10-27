export type InboundMessage = {
  from: string
  id?: string
  type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'DOCUMENT'
  text?: string
  mediaUrl?: string
  mime?: string
}

export interface WhatsAppProvider {
  verifySignature?(raw: Buffer, headers: Record<string, string>): boolean
  parseInbound(body: unknown): InboundMessage
  sendText(to: string, text: string): Promise<void>
  getMedia(url: string): Promise<{ buffer: Buffer; mime: string }>
}

export class WhatsAppProviderEvolution implements WhatsAppProvider {
  constructor(private readonly cfg: { baseUrl: string; session: string; token?: string }) {}

  parseInbound(body: any): InboundMessage {
    // Accepts multiple formats. Attempts a best-effort normalization for Evolution-like payloads.
    const tryJid = (v: any) => (typeof v === 'string' ? v.replace(/@.*$/, '') : '')
    const id: string | undefined = body?.id || body?.key?.id || body?.message?.id
    const from: string = body?.from || tryJid(body?.key?.remoteJid) || tryJid(body?.chatId) || ''
    const text: string | undefined =
      body?.text ||
      body?.body ||
      body?.message?.conversation ||
      body?.message?.extendedTextMessage?.text ||
      body?.message?.imageMessage?.caption
    // naive media detection
    const hasImage = !!(body?.message?.imageMessage || body?.image || body?.mediaType === 'image')
    const hasAudio = !!(body?.message?.audioMessage || body?.audio || body?.mediaType === 'audio')
    const mediaUrl: string | undefined = body?.mediaUrl || body?.message?.imageMessage?.url || body?.message?.audioMessage?.url
    if (hasImage) return { id, from, type: 'IMAGE', text, mediaUrl }
    if (hasAudio) return { id, from, type: 'AUDIO', text, mediaUrl }
    return { id, from, type: 'TEXT', text }
  }

  async sendText(to: string, text: string): Promise<void> {
    const url = `${this.cfg.baseUrl}/message/sendText`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.cfg.token ? { Authorization: `Bearer ${this.cfg.token}` } : {}),
      },
      body: JSON.stringify({ session: this.cfg.session, to, text }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Evolution sendText failed: ${res.status} ${body}`)
    }
  }

  async getMedia(url: string): Promise<{ buffer: Buffer; mime: string }> {
    const res = await fetch(url, { headers: this.cfg.token ? { Authorization: `Bearer ${this.cfg.token}` } : {} })
    if (!res.ok) throw new Error(`Failed to download media: ${res.status}`)
    const ct = res.headers.get('content-type') || 'application/octet-stream'
    const arr = await res.arrayBuffer()
    return { buffer: Buffer.from(arr), mime: ct }
  }
}
