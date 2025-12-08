"use client"

import { useState, useEffect } from "react"
import { Target, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface Challenge {
  id: string
  type: string
  description: string
  targetValue: number | null
  currentValue: number | null
  status: "proposed" | "accepted" | "completed" | "failed"
  startDate: string
  endDate: string
}

export function ChallengeCard() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadChallenges()
  }, [])

  const loadChallenges = async (generate = false) => {
    try {
      setLoading(true)
      const url = generate ? "/api/challenges?generate=true" : "/api/challenges"
      const response = await fetch(url)

      if (!response.ok) throw new Error("Failed to fetch")

      const data = await response.json()
      setChallenges(data.challenges)

      if (generate) {
        toast({
          title: "Novos desafios gerados!",
          description: "Aceite um desafio e comece a economizar",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar desafios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setGenerating(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    await loadChallenges(true)
  }

  const handleAccept = async (id: string) => {
    try {
      const response = await fetch("/api/challenges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: id, status: "accepted" }),
      })

      if (!response.ok) throw new Error("Failed to accept")

      toast({
        title: "Desafio aceito!",
        description: "Boa sorte! Acompanhe seu progresso.",
      })

      await loadChallenges()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao aceitar desafio",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      proposed: { label: "Proposto", variant: "secondary" },
      accepted: { label: "Em Andamento", variant: "default" },
      completed: { label: "Concluído", variant: "default" },
      failed: { label: "Não Concluído", variant: "destructive" },
    }
    return badges[status] || { label: status, variant: "secondary" }
  }

  const getTypeIcon = (type: string) => {
    if (type === "reduce_category" || type === "save_amount") return <Target className="h-5 w-5" />
    if (type === "streak") return <Clock className="h-5 w-5" />
    return <Target className="h-5 w-5" />
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  const activeAndProposed = challenges.filter((c) => c.status === "proposed" || c.status === "accepted")
  const completed = challenges.filter((c) => c.status === "completed" || c.status === "failed")

  if (loading && challenges.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Desafios Semanais</h2>
          <p className="text-muted-foreground">Aceite desafios e melhore sua saúde financeira</p>
        </div>
        <Button onClick={handleGenerate} disabled={generating} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Gerando..." : "Gerar Novos"}
        </Button>
      </div>

      {activeAndProposed.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Nenhum desafio ativo</p>
            <p className="text-sm text-muted-foreground mb-4">
              Gere novos desafios personalizados baseados em seus hábitos
            </p>
            <Button onClick={handleGenerate}>Gerar Desafios</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {activeAndProposed.map((challenge) => {
            const statusBadge = getStatusBadge(challenge.status)
            const daysRemaining = getDaysRemaining(challenge.endDate)
            const progress = challenge.targetValue
              ? ((challenge.currentValue || 0) / challenge.targetValue) * 100
              : 0

            return (
              <Card key={challenge.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(challenge.type)}
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    </div>
                    {daysRemaining > 0 && (
                      <span className="text-sm text-muted-foreground">{daysRemaining}d restantes</span>
                    )}
                  </div>
                  <CardTitle className="text-base">{challenge.description}</CardTitle>
                </CardHeader>
                <CardContent>
                  {challenge.targetValue && (
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>
                          R$ {(challenge.currentValue || 0).toFixed(2)} / R$ {challenge.targetValue.toFixed(2)}
                        </span>
                      </div>
                      <Progress value={Math.min(progress, 100)} />
                    </div>
                  )}

                  {challenge.status === "proposed" && (
                    <Button onClick={() => handleAccept(challenge.id)} className="w-full">
                      Aceitar Desafio
                    </Button>
                  )}

                  {challenge.status === "accepted" && (
                    <div className="text-sm text-muted-foreground">
                      Continue assim! Acompanhe suas transações para ver o progresso.
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Histórico</h3>
          <div className="space-y-2">
            {completed.slice(0, 5).map((challenge) => (
              <Card key={challenge.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {challenge.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="text-sm">{challenge.description}</span>
                  </div>
                  <Badge variant={challenge.status === "completed" ? "default" : "destructive"}>
                    {challenge.status === "completed" ? "Concluído" : "Falhou"}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
