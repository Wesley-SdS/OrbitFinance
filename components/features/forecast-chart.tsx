"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface MonthForecast {
  month: string
  year: number
  expectedIncome: number
  expectedExpenses: number
  projectedBalance: number
  alert: string | null
  breakdown: {
    recurring: number
    variable: number
    seasonal: number
  }
}

interface ForecastData {
  currentBalance: number
  forecast: {
    months: MonthForecast[]
    recommendations: string[]
    emergencyFundStatus: {
      current: number
      recommended: number
      monthsCovered: number
    }
  }
}

export function ForecastChart() {
  const [data, setData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadForecast()
  }, [])

  const loadForecast = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/forecast")

      if (!response.ok) throw new Error("Failed to fetch")

      const result = await response.json()
      setData(result)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar previsão",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Gerando previsão...</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">Erro ao carregar previsão</p>
        </CardContent>
      </Card>
    )
  }

  const { currentBalance, forecast } = data
  const emergencyFundProgress =
    (forecast.emergencyFundStatus.current / forecast.emergencyFundStatus.recommended) * 100

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Saldo Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">R$ {currentBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Previsão para os Próximos 3 Meses</CardTitle>
          <CardDescription>Projeção baseada em seu histórico de transações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {forecast.months.map((month, i) => {
            const isPositive = month.projectedBalance > currentBalance
            const Icon = isPositive ? TrendingUp : TrendingDown

            return (
              <div key={i} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {month.month} {month.year}
                    </h3>
                    {month.alert && (
                      <Badge variant="destructive" className="mt-1">
                        {month.alert}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                      <Icon className="inline h-5 w-5 mr-1" />
                      R$ {month.projectedBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">Saldo projetado</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Receitas esperadas</p>
                    <p className="font-semibold text-green-600">
                      +R$ {month.expectedIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Despesas esperadas</p>
                    <p className="font-semibold text-red-600">
                      -R$ {month.expectedExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Composição de gastos:</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-muted p-2 rounded">
                      <p className="text-muted-foreground">Recorrentes</p>
                      <p className="font-semibold">R$ {month.breakdown.recurring.toFixed(0)}</p>
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <p className="text-muted-foreground">Variáveis</p>
                      <p className="font-semibold">R$ {month.breakdown.variable.toFixed(0)}</p>
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <p className="text-muted-foreground">Sazonais</p>
                      <p className="font-semibold">R$ {month.breakdown.seasonal.toFixed(0)}</p>
                    </div>
                  </div>
                </div>

                {i < forecast.months.length - 1 && <div className="border-b" />}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reserva de Emergência</CardTitle>
          <CardDescription>Status do seu fundo de segurança</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {forecast.emergencyFundStatus.monthsCovered.toFixed(1)} meses cobertos de{" "}
                {(forecast.emergencyFundStatus.recommended / forecast.emergencyFundStatus.current) * forecast.emergencyFundStatus.monthsCovered > 6 ? "6" : "6"}
              </span>
              <span className="font-medium">
                R$ {forecast.emergencyFundStatus.current.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / R${" "}
                {forecast.emergencyFundStatus.recommended.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <Progress value={Math.min(emergencyFundProgress, 100)} />
          </div>

          {emergencyFundProgress < 100 && (
            <p className="text-sm text-muted-foreground">
              Faltam R${" "}
              {(forecast.emergencyFundStatus.recommended - forecast.emergencyFundStatus.current).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}{" "}
              para atingir a reserva recomendada de 6 meses.
            </p>
          )}
        </CardContent>
      </Card>

      {forecast.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recomendações</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {forecast.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="text-primary font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
