import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

const geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { message, sessionId } = body as { message: string; sessionId?: string }

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const chatSessionId = sessionId || `chat_${Date.now()}_${session.user.id}`

    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [transactions, goals, accounts] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId: session.user.id,
          deletedAt: null,
          date: {
            gte: thirtyDaysAgo,
          },
        },
        include: {
          category: true,
        },
        orderBy: {
          date: "desc",
        },
        take: 100,
      }),
      prisma.goal.findMany({
        where: {
          userId: session.user.id,
          deletedAt: null,
        },
      }),
      prisma.financialAccount.findMany({
        where: {
          userId: session.user.id,
          isActive: true,
        },
      }),
    ])

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)

    const spendingByCategory = transactions
      .filter((t) => t.type === "expense")
      .reduce(
        (acc, t) => {
          const categoryName = t.category?.name || "Outros"
          acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount)
          return acc
        },
        {} as Record<string, number>
      )

    const topCategories = Object.entries(spendingByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    const recentMessages = await prisma.chatMessage.findMany({
      where: {
        userId: session.user.id,
        sessionId: chatSessionId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    })

    const conversationHistory = recentMessages
      .reverse()
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")

    const prompt = `Você é o assistente financeiro do OrbitFinance. Responda de forma útil e com dados reais do usuário.

CONTEXTO DO USUÁRIO:
- Saldo total: R$ ${totalBalance.toFixed(2)}
- Receita mensal (últimos 30 dias): R$ ${totalIncome.toFixed(2)}
- Despesa mensal (últimos 30 dias): R$ ${totalExpense.toFixed(2)}
- Saldo do período: R$ ${(totalIncome - totalExpense).toFixed(2)}
- Últimas transações: ${JSON.stringify(transactions.slice(0, 20).map((t) => ({ date: t.date, description: t.description, amount: t.amount, type: t.type, category: t.category?.name })))}
- Goals: ${JSON.stringify(goals.map((g) => ({ name: g.name, currentAmount: g.currentAmount, targetAmount: g.targetAmount })))}
- Top categorias de gasto: ${JSON.stringify(topCategories)}

${conversationHistory ? `HISTÓRICO DA CONVERSA:\n${conversationHistory}\n` : ""}

PERGUNTA DO USUÁRIO: ${message}

Responda de forma:
- Direta e objetiva (máximo 3-4 parágrafos)
- Com números específicos do usuário quando relevante
- Sugerindo ações práticas quando aplicável
- Em português brasileiro
- Sem markdown complexo, apenas texto formatado

Se for pergunta sobre "quanto gastei com X", calcule dos dados fornecidos.
Se for simulação financeira, faça os cálculos com base nos dados.
Se não souber algo específico que não está nos dados, diga isso claramente.
Seja educado, útil e financeiramente responsável.`

    const model = geminiClient.getGenerativeModel({ model: "gemini-1.5-flash" })
    const result = await model.generateContent(prompt)
    const aiResponse = result.response.text()

    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        sessionId: chatSessionId,
        role: "user",
        content: message,
      },
    })

    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        sessionId: chatSessionId,
        role: "assistant",
        content: aiResponse,
      },
    })

    return NextResponse.json({
      success: true,
      sessionId: chatSessionId,
      message: aiResponse,
      context: {
        totalBalance,
        totalIncome,
        totalExpense,
        transactionsCount: transactions.length,
      },
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json(
      {
        error: "Failed to process chat message",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        userId: session.user.id,
        sessionId,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return NextResponse.json({
      success: true,
      messages,
    })
  } catch (error) {
    console.error("Chat history error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch chat history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
