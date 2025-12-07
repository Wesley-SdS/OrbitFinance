import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Evolution API envia eventos de conexão para esta rota
// Apenas retornamos 200 OK para não gerar erros
export async function POST() {
  console.log('[WhatsApp] Connection update received')
  return NextResponse.json({ status: 'ok' })
}

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
