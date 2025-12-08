"use client"

import { useState, useEffect } from "react"
import { TrendingUp, AlertCircle, CheckCircle2, Trophy, Target } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface ScoreData {
  score: number
  level: "Crítico" | "Atenção" | "Bom" | "Muito Bom" | "Excelente"
  factors: {
    spendingRatio: number
    emergencyFund: number
    goalProgress: number
    consistency: number
    savings: number
  }
  recommendations: string[]
}

export function ScoreCard() {
  const [scoreData, setScoreData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadScore()
  }, [])

  const loadScore = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/score")

      if (!response.ok) throw new Error("Failed to fetch")

      const data = await response.json()
      setScoreData(data)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar score",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      Crítico: "text-red-600",
      Atenção: "text-orange-600",
      Bom: "text-yellow-600",
      "Muito Bom": "text-blue-600",
      Excelente: "text-green-600",
    }
    return colors[level] || "text-gray-600"
  }

  const getLevelIcon = (level: string) => {
    if (level === "Excelente" || level === "Muito Bom") return <Trophy className="h-6 w-6" />
    if (level === "Bom") return <CheckCircle2 className="h-6 w-6" />
    if (level === "Atenção") return <Target className="h-6 w-6" />
    return <AlertCircle className="h-6 w-6" />
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Calculando seu score...</p>
        </CardContent>
      </Card>
    )
  }

  if (!scoreData) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Erro ao carregar score</p>
          <Button onClick={loadScore} variant="outline">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  const factors = [
    { name: "Controle de Gastos", value: scoreData.factors.spendingRatio, max: 300 },
    { name: "Reserva de Emergência", value: scoreData.factors.emergencyFund, max: 250 },
    { name: "Progresso em Metas", value: scoreData.factors.goalProgress, max: 200 },
    { name: "Consistência", value: scoreData.factors.consistency, max: 150 },
    { name: "Taxa de Poupança", value: scoreData.factors.savings, max: 100 },
  ]

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-4xl font-bold">{scoreData.score}</CardTitle>
          <CardDescription className="text-lg">de 1000 pontos</CardDescription>
        </CardHeader>
        <CardContent className="text-center pb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getLevelColor(scoreData.level)}`}>
            {getLevelIcon(scoreData.level)}
            <span className="text-xl font-semibold">{scoreData.level}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fatores do Score</CardTitle>
          <CardDescription>Como sua pontuação é calculada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {factors.map((factor, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{factor.name}</span>
                <span className="text-muted-foreground">
                  {factor.value}/{factor.max}
                </span>
              </div>
              <Progress value={(factor.value / factor.max) * 100} />
            </div>
          ))}
        </CardContent>
      </Card>

      {scoreData.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recomendações para Melhorar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {scoreData.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">💡 Sobre o Score</h3>
          <p className="text-sm text-muted-foreground">
            Seu score financeiro é calculado com base em 5 fatores essenciais para sua saúde financeira. Acompanhe
            mensalmente para ver sua evolução!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
