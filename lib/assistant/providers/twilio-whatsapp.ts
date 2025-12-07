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

export class TwilioWhatsAppProvider implements WhatsAppProvider {
  constructor(private readonly cfg: { 
    accountSid: string
    authToken: string
    phoneNumber: string
  }) {}

  verifySignature(req: any): boolean {
    // Twilio webhook verification (X-Twilio-Signature)
    const signature = req.headers['x-twilio-signature'];
    if (!signature) return false;
    
    // Twilio verification will be handled by the main middleware
    return true;
  }

  parseInbound(body: any): InboundMessage {
    // Parse Twilio WhatsApp webhook payload
    const from = body.From; // From user (whatsapp:+...)
    const id = body.MessageSid;
    const text = body.Body; // Message text
    const numMedia = parseInt(body.NumMedia) || 0;
    
    // Handle media attachments
    let type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'DOCUMENT' = 'TEXT';
    let mediaUrl: string | undefined;
    let mime: string | undefined;
    
    if (numMedia > 0) {
      // Twilio provides MediaUrl0, MediaUrl1, etc.
      const firstMediaUrl = body.MediaUrl0;
      const firstMediaType = body.MediaContentType0;
      
      if (firstMediaUrl) {
        type = firstMediaType?.includes('image') ? 'IMAGE' : 
              firstMediaType?.includes('audio') ? 'AUDIO' : 'DOCUMENT';
        mediaUrl = firstMediaUrl;
        mime = firstMediaType;
      }
    }
    
    return {
      id,
      from: from.replace('whatsapp:', ''),
      type,
      text,
      mediaUrl,
      mime
    };
  }

  async sendText(to: string, text: string): Promise<void> {
    const twilio = require('twilio');
    const client = twilio(this.cfg.accountSid, this.cfg.authToken);
    
    try {
      await client.messages.create({
        body: text,
        from: this.cfg.phoneNumber,
        to: `whatsapp:+${to}`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Twilio sendText failed: ${errorMessage}`);
    }
  }

  async getMedia(url: string): Promise<{ buffer: Buffer; mime: string }> {
    try {
      // Download media from Twilio URL
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to download media: ${response.status}`);
      }
      
      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type');
      
      return { 
        buffer, 
        mime: contentType || 'application/octet-stream' 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to get media: ${errorMessage}`);
    }
  }
}