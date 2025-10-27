export interface SpeechToTextProvider {
  transcribe(input: Buffer, mime: string): Promise<string>
}

export class SttNoop implements SpeechToTextProvider {
  async transcribe(_input: Buffer, _mime: string) {
    return ''
  }
}

export class SttOpenAI implements SpeechToTextProvider {
  constructor(private readonly apiKey: string) {}
  async transcribe(input: Buffer, mime: string): Promise<string> {
    const form = new FormData()
    const file = new Blob([new Uint8Array(input)], { type: mime })
    form.set('file', file, 'audio.webm')
    form.set('model', 'whisper-1')
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form as any,
    })
    if (!res.ok) return ''
    const json: any = await res.json().catch(() => ({}))
    return (json.text as string | undefined) ?? ''
  }
}

export function getSttProvider(): SpeechToTextProvider {
  const key = process.env.OPENAI_API_KEY
  if (key) return new SttOpenAI(key)
  return new SttNoop()
}
