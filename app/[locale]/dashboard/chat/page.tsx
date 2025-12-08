import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ChatInterface } from "@/components/features/chat-interface"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Chat Financeiro | OrbitFinance",
}

export default async function ChatPage() {
  const session = await auth.api.getSession({
    headers: await Promise.resolve(new Headers()),
  })

  if (!session?.user) {
    redirect("/sign-in")
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Chat Financeiro</h1>
        <p className="text-muted-foreground">
          Converse com nossa IA sobre suas finanças e receba insights personalizados
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assistente OrbiFinance AI</CardTitle>
          <CardDescription>
            Pergunte sobre gastos, receitas, metas ou peça dicas de economia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChatInterface />
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💬 Perguntas que posso responder</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Quanto gastei com [categoria] este mês?</li>
              <li>• Qual meu maior gasto?</li>
              <li>• Como estão minhas metas?</li>
              <li>• Consigo comprar algo de R$ X?</li>
              <li>• Devo parcelar ou pagar à vista?</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🔒 Privacidade</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Apenas você tem acesso ao histórico</li>
              <li>✓ Dados não são compartilhados</li>
              <li>✓ Respostas baseadas em seus dados reais</li>
              <li>✓ IA treinada para segurança financeira</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
