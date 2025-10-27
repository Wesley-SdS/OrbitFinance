import { NextRequest, NextResponse } from 'next/server'
import { InboundRouter } from '../../../../lib/assistant/inbound'
import { WhatsAppProviderEvolution } from '../../../../lib/assistant/providers/whatsapp'
import { getEvolutionConfig } from '../../../../lib/assistant/config'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const evoCfg = getEvolutionConfig()
  const provider = evoCfg ? new WhatsAppProviderEvolution(evoCfg) : null
  const msg = provider ? provider.parseInbound(body) : normalizeInbound(body)
  const router = new InboundRouter()
  const res = await router.handle(msg as any, provider ?? undefined)
  return NextResponse.json(res)
}

function normalizeInbound(body: any) {
  // Local dev format: { from, id, type, text, mediaUrl, mime }
  const from = String(body.from ?? '')
  const id = body.id ? String(body.id) : undefined
  const type = (body.type ?? 'TEXT').toUpperCase()
  const text = body.text ? String(body.text) : undefined
  const mediaUrl = body.mediaUrl ? String(body.mediaUrl) : undefined
  const mime = body.mime ? String(body.mime) : undefined
  return { id, from, type, text, mediaUrl, mime }
}
