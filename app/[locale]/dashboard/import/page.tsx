import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { StatementUpload } from "@/components/features/statement-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const metadata = {
  title: "Importar Extrato | OrbitFinance",
}

export default async function ImportPage() {
  const session = await auth.api.getSession({
    headers: await Promise.resolve(new Headers()),
  })

  if (!session?.user) {
    redirect("/sign-in")
  }

  const accounts = await prisma.financialAccount.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  const defaultAccount = accounts[0]

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Importar Extrato Bancário</h1>
        <p className="text-muted-foreground">
          Faça upload de um PDF do seu banco para extrair e importar transações automaticamente
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Selecione a Conta</CardTitle>
          <CardDescription>Escolha em qual conta as transações serão importadas</CardDescription>
        </CardHeader>
        <CardContent>
          <Select defaultValue={defaultAccount?.id}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} ({account.type}) - R${" "}
                  {Number(account.balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {defaultAccount && (
        <Suspense fallback={<div>Carregando...</div>}>
          <StatementUpload accountId={defaultAccount.id} />
        </Suspense>
      )}

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">💡 Como funciona?</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>✓ Faça upload do PDF do seu extrato bancário</li>
          <li>✓ Nossa IA extrai automaticamente todas as transações</li>
          <li>✓ Categoriza cada transação inteligentemente</li>
          <li>✓ Detecta e remove duplicatas automaticamente</li>
          <li>✓ Você revisa e seleciona o que importar</li>
        </ul>
      </div>
    </div>
  )
}
