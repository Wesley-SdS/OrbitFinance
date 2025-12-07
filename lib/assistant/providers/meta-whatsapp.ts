export type InboundMessage = {
  from: string
  id?: string
  type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'DOCUMENT'
  text?: string
  mediaUrl?: string
  mime?: string
}

export interface WhatsAppProvider {
  verifySignature?(req: any): boolean
  parseInbound(body: unknown): InboundMessage
  sendText(to: string, text: string): Promise<void>
  getMedia(url: string): Promise<{ buffer: Buffer; mime: string }>
}

export class MetaWhatsAppProvider implements WhatsAppProvider {
  constructor(private readonly cfg: { 
    phoneNumberId: string
    accessToken: string
    webhookVerifyToken: string
  }) {}

  verifySignature(req: any): boolean {
    // Meta webhook verification
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === this.cfg.webhookVerifyToken) {
        return true;
      }
    }
    return false;
  }

  parseInbound(body: any): InboundMessage {
    // Parse Meta WhatsApp webhook payload
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const messages = change.value.messages;
            
            if (messages && messages.length > 0) {
              const message = messages[0];
              
              // Skip messages from our own number
              if (message.from === this.cfg.phoneNumberId.replace('whatsapp', '').replace('+', '')) {
                continue;
              }

              const from = message.from;
              const id = message.id;

              // Handle text messages
              if (message.type === 'text') {
                return {
                  id,
                  from,
                  type: 'TEXT',
                  text: message.text.body
                };
              }

              // Handle other message types
              if (message.type === 'image') {
                return {
                  id,
                  from,
                  type: 'IMAGE',
                  text: message.image?.caption,
                  mediaUrl: message.image?.id
                };
              }

              if (message.type === 'audio') {
                return {
                  id,
                  from,
                  type: 'AUDIO',
                  mediaUrl: message.audio?.id
                };
              }

              if (message.type === 'document') {
                return {
                  id,
                  from,
                  type: 'DOCUMENT',
                  text: message.document?.caption,
                  mediaUrl: message.document?.id,
                  mime: message.document?.mime_type
                };
              }
            }
          }
        }
      }
    }

    // Return empty message if nothing parsed
    return { from: '', type: 'TEXT' };
  }

  async sendText(to: string, text: string): Promise<void> {
    const url = `https://graph.facebook.com/v18.0/${this.cfg.phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      text: {
        body: text
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.cfg.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Meta sendText failed: ${response.status} ${body}`);
    }
  }

  async getMedia(mediaId: string): Promise<{ buffer: Buffer; mime: string }> {
    const url = `https://graph.facebook.com/v18.0/${mediaId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.cfg.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Meta getMedia failed: ${response.status}`);
    }

    const data = await response.json();
    const mime = data.mime_type;
    
    // Download the actual media file
    const mediaResponse = await fetch(data.url, {
      headers: {
        'Authorization': `Bearer ${this.cfg.accessToken}`
      }
    });

    if (!mediaResponse.ok) {
      throw new Error(`Failed to download media: ${mediaResponse.status}`);
    }

    const buffer = Buffer.from(await mediaResponse.arrayBuffer());
    
    return { buffer, mime };
  }
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
    const { downloadWithRetry } = await import('../retry')

    try {
      const buffer = await downloadWithRetry(url, this.cfg.token)
      const mime = 'application/octet-stream'
      return { buffer, mime }
    } catch (error) {
      throw new Error(`Failed to download media: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}