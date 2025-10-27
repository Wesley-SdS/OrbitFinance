export interface OcrProvider {
  extractText(image: Buffer, mime: string): Promise<string>
}

export class OcrNoop implements OcrProvider {
  async extractText(_image: Buffer, _mime: string) {
    return ''
  }
}

export class OcrOcrSpace implements OcrProvider {
  constructor(private readonly apiKey: string, private readonly endpoint = 'https://api.ocr.space/parse/image') {}
  async extractText(image: Buffer, mime: string): Promise<string> {
    const body = new URLSearchParams()
    body.set('language', 'por')
    body.set('isOverlayRequired', 'false')
    body.set('base64Image', `data:${mime};base64,${image.toString('base64')}`)
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { apikey: this.apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    if (!res.ok) return ''
    const json: any = await res.json().catch(() => ({}))
    const parsed = json?.ParsedResults?.[0]?.ParsedText as string | undefined
    return parsed ? parsed.trim() : ''
  }
}

export function getOcrProvider(): OcrProvider {
  const key = process.env.OCRSPACE_API_KEY
  if (key) return new OcrOcrSpace(key)
  return new OcrNoop()
}
