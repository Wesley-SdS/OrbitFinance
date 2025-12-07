"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle2, XCircle, Phone, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SettingsPage() {
  const t = useTranslations()
  const { toast } = useToast()

  const [whatsappPhone, setWhatsappPhone] = useState("")
  const [currentPhone, setCurrentPhone] = useState<string | null>(null)
  const [isLinked, setIsLinked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Load current WhatsApp status
  useEffect(() => {
    loadWhatsAppStatus()
  }, [])

  const loadWhatsAppStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/user/whatsapp/status")
      const data = await response.json()

      setIsLinked(data.linked)
      setCurrentPhone(data.phone || null)
      setWhatsappPhone(data.phone || "")
    } catch (error) {
      console.error("Failed to load WhatsApp status:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar",
        description: "Não foi possível carregar o status do WhatsApp.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkWhatsApp = async () => {
    if (!whatsappPhone) {
      toast({
        variant: "destructive",
        title: "Número obrigatório",
        description: "Digite um número de WhatsApp válido.",
      })
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch("/api/user/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: whatsappPhone }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao vincular WhatsApp")
      }

      toast({
        title: "WhatsApp vinculado!",
        description: "Agora você pode enviar mensagens para registrar transações.",
      })

      await loadWhatsAppStatus()
    } catch (error) {
      console.error("Failed to link WhatsApp:", error)
      toast({
        variant: "destructive",
        title: "Erro ao vincular",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnlinkWhatsApp = async () => {
    try {
      setIsSaving(true)
      const response = await fetch("/api/user/whatsapp", {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao desvincular WhatsApp")
      }

      toast({
        title: "WhatsApp desvinculado",
        description: "Seu número foi removido com sucesso.",
      })

      setWhatsappPhone("")
      await loadWhatsAppStatus()
    } catch (error) {
      console.error("Failed to unlink WhatsApp:", error)
      toast({
        variant: "destructive",
        title: "Erro ao desvincular",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências e integrações</p>
      </div>

      {/* WhatsApp Integration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Integração WhatsApp
              </CardTitle>
              <CardDescription>
                Configure seu número para receber e enviar transações via WhatsApp
              </CardDescription>
            </div>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : isLinked ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <XCircle className="h-3 w-3" />
                Desconectado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Com o WhatsApp vinculado, você pode enviar mensagens como{" "}
              <strong>"gastei R$ 50 em alimentação"</strong> para registrar transações automaticamente.
            </AlertDescription>
          </Alert>

          {/* Phone Input */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp">Número do WhatsApp</Label>
            <div className="flex gap-2">
              <Input
                id="whatsapp"
                type="tel"
                placeholder="5511999999999"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value.replace(/\D/g, ""))}
                disabled={isLoading || isSaving}
                className="flex-1"
              />
              {isLinked ? (
                <Button
                  variant="destructive"
                  onClick={handleUnlinkWhatsApp}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Desvincular
                </Button>
              ) : (
                <Button
                  onClick={handleLinkWhatsApp}
                  disabled={isSaving || !whatsappPhone}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Vincular
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Digite o número com código do país (ex: 5511999999999 para Brasil)
            </p>
          </div>

          {/* Current Status */}
          {isLinked && currentPhone && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Número vinculado:</p>
              <p className="text-lg font-mono">{currentPhone}</p>
            </div>
          )}

          {/* Usage Instructions */}
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium">Como usar:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Envie mensagens para o número do OrbiFinance</li>
              <li>Exemplos: "gastei 50 reais", "recebi 1000 salário"</li>
              <li>Use #tags para categorias: "gastei 30 #alimentacao"</li>
              <li>O sistema registra automaticamente suas transações</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
