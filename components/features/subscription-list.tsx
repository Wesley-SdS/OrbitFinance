"use client"

import { useState, useEffect } from "react"
import { Trash2, RefreshCw, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface Subscription {
  id: string
  name: string
  amount: number
  frequency: string
  category: string | null
  lastCharge: string
  isActive: boolean
}

interface SubscriptionSummary {
  total: number
  monthlyTotal: number
  annualCost: number
  count: number
}

export function SubscriptionList() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSubscriptions()
  }, [])

  const loadSubscriptions = async (refresh = false) => {
    try {
      setLoading(true)
      const url = refresh ? "/api/subscriptions?refresh=true" : "/api/subscriptions"
      const response = await fetch(url)

      if (!response.ok) throw new Error("Failed to fetch")

      const data = await response.json()
      setSubscriptions(data.subscriptions)
      setSummary(data.summary)

      if (refresh) {
        toast({
          title: "Atualizado!",
          description: `${data.summary.count} assinaturas detectadas`,
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar assinaturas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadSubscriptions(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/subscriptions?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete")

      toast({
        title: "Sucesso",
        description: "Assinatura desativada",
      })

      await loadSubscriptions()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao desativar assinatura",
        variant: "destructive",
      })
    }
  }

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      monthly: "Mensal",
      weekly: "Semanal",
      biweekly: "Quinzenal",
    }
    return labels[frequency] || frequency
  }

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="text-2xl font-bold">R$ {summary.monthlyTotal.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Total Mensal</p>
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold">R$ {summary.annualCost.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Custo Anual</p>
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold">{summary.count}</div>
            <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
          </Card>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Assinaturas Detectadas</h2>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>

      {subscriptions.length === 0 ? (
        <Card className="p-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Nenhuma assinatura detectada</p>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione transações recorrentes para que possamos detectar suas assinaturas
          </p>
          <Button onClick={handleRefresh} variant="outline">
            Analisar Transações
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <Card key={sub.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{sub.name}</h3>
                    <Badge variant="secondary">{getFrequencyLabel(sub.frequency)}</Badge>
                    {sub.category && <Badge variant="outline">{sub.category}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Última cobrança: {new Date(sub.lastCharge).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xl font-bold">R$ {sub.amount.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {sub.frequency === "monthly" && `R$ ${(sub.amount * 12).toFixed(2)}/ano`}
                    </div>
                  </div>

                  <Button onClick={() => handleDelete(sub.id)} variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {subscriptions.length > 0 && summary && (
        <Card className="p-6 bg-muted">
          <h3 className="font-semibold mb-3">💡 Economia Potencial</h3>
          <p className="text-sm text-muted-foreground">
            Se você cancelar apenas 1 assinatura de R$ {(summary.total / summary.count).toFixed(2)}, economizará R${" "}
            {((summary.total / summary.count) * 12).toFixed(2)} por ano. Revise periodicamente se todas são
            essenciais!
          </p>
        </Card>
      )}
    </div>
  )
}
