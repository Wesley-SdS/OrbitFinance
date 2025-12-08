import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SubscriptionList } from "@/components/features/subscription-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Assinaturas | OrbitFinance",
}

export default async function SubscriptionsPage() {
  const session = await auth.api.getSession({
    headers: await Promise.resolve(new Headers()),
  })

  if (!session?.user) {
    redirect("/sign-in")
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gerenciar Assinaturas</h1>
        <p className="text-muted-foreground">
          Acompanhe e gerencie seus gastos recorrentes detectados automaticamente
        </p>
      </div>

      <SubscriptionList />

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Como funciona a detecção?</CardTitle>
            <CardDescription>Nossa IA analisa seus padrões de gastos</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>✓ Detectamos transações com valores similares (variação de ±15%)</li>
              <li>✓ Identificamos padrões mensais, quinzenais e semanais</li>
              <li>✓ Agrupamos por descrição normalizada</li>
              <li>✓ Calculamos o custo anual automaticamente</li>
              <li>✓ Atualize a análise para detectar novas assinaturas</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
