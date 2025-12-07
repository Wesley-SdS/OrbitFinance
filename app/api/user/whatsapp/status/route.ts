import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers
  })

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const userRecord = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { whatsappPhone: true }
    })

    return NextResponse.json({ 
      linked: !!userRecord?.whatsappPhone,
      phone: userRecord?.whatsappPhone 
    })

  } catch (error) {
    console.error('WhatsApp status error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export { GET }