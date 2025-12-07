import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { validateBrazilianPhone } from '@/lib/validators/phone'

const schema = z.object({
  phone: z.string().min(10, 'Telefone muito curto')
})

async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers
  })

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { phone } = schema.parse(body)

    // Validate Brazilian phone format
    const validation = validateBrazilianPhone(phone)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const normalizedPhone = validation.normalized

    // Check if phone is already linked to another user
    const existingUser = await prisma.user.findFirst({
      where: {
        whatsappPhone: normalizedPhone,
        id: { not: session.user.id }
      }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Número já vinculado a outro usuário' }, { status: 409 })
    }

    // Update user with validated phone
    await prisma.user.update({
      where: { id: session.user.id },
      data: { whatsappPhone: normalizedPhone }
    })

    return NextResponse.json({
      success: true,
      message: 'WhatsApp vinculado com sucesso',
      phone: normalizedPhone
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error('WhatsApp link error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers
  })

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { whatsappPhone: null }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Vínculo removido' 
    })

  } catch (error) {
    console.error('WhatsApp unlink error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export { POST, DELETE }