"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

interface Transaction {
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  suggestedCategory: string
}

interface UploadedStatement {
  bank: string
  period: { start: string; end: string }
  transactions: Transaction[]
  totalIncome: number
  totalExpense: number
}

interface StatementUploadProps {
  accountId: string
  onSuccess?: () => void
}

export function StatementUpload({ accountId, onSuccess }: StatementUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [statement, setStatement] = useState<UploadedStatement | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      if (file.type !== "application/pdf") {
        toast({
          title: "Erro",
          description: "Apenas arquivos PDF são aceitos",
          variant: "destructive",
        })
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Máximo: 10MB",
          variant: "destructive",
        })
        return
      }

      setUploading(true)
      const formData = new FormData()
      formData.append("file", file)

      try {
        const response = await fetch("/api/statements/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Falha no upload")
        }

        const data = await response.json()
        setStatement(data.data)
        setSelected(new Set(data.data.transactions.map((_: any, i: number) => i)))

        toast({
          title: "Sucesso!",
          description: `${data.data.totalTransactions} transações extraídas`,
        })
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao processar PDF",
          variant: "destructive",
        })
      } finally {
        setUploading(false)
      }
    },
    [toast]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: uploading || importing,
  })

  const handleImport = async () => {
    if (!statement) return

    const selectedTransactions = statement.transactions.filter((_, i) => selected.has(i))

    if (selectedTransactions.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos uma transação",
        variant: "destructive",
      })
      return
    }

    setImporting(true)

    try {
      const response = await fetch("/api/statements/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: selectedTransactions,
          accountId,
        }),
      })

      if (!response.ok) {
        throw new Error("Falha na importação")
      }

      const data = await response.json()

      toast({
        title: "Importação concluída!",
        description: `${data.imported} transações importadas, ${data.duplicates} duplicatas ignoradas`,
      })

      setStatement(null)
      setSelected(new Set())
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao importar transações",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  const toggleAll = () => {
    if (!statement) return
    if (selected.size === statement.transactions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(statement.transactions.map((_, i) => i)))
    }
  }

  const toggleTransaction = (index: number) => {
    const newSelected = new Set(selected)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelected(newSelected)
  }

  if (statement) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{statement.bank}</h3>
              <p className="text-sm text-muted-foreground">
                {statement.period.start} até {statement.period.end}
              </p>
            </div>
            <Button variant="outline" onClick={() => setStatement(null)}>
              Cancelar
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <Checkbox checked={selected.size === statement.transactions.length} onCheckedChange={toggleAll} />
            <span className="text-sm">
              {selected.size} de {statement.transactions.length} selecionadas
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {statement.transactions.map((tx, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 border rounded hover:bg-accent cursor-pointer"
                onClick={() => toggleTransaction(i)}
              >
                <Checkbox checked={selected.has(i)} onCheckedChange={() => toggleTransaction(i)} />
                <div className="flex-1">
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.date} · {tx.suggestedCategory}
                  </p>
                </div>
                <span className={`font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                  {tx.type === "income" ? "+" : "-"}R$ {tx.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between">
            <div className="space-y-1">
              <p className="text-sm text-green-600">Receitas: R$ {statement.totalIncome.toFixed(2)}</p>
              <p className="text-sm text-red-600">Despesas: R$ {statement.totalExpense.toFixed(2)}</p>
            </div>
            <Button onClick={handleImport} disabled={importing || selected.size === 0}>
              {importing ? "Importando..." : `Importar ${selected.size} transações`}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
      } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        {uploading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            <p className="text-lg font-medium">Processando PDF...</p>
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-lg font-medium mb-1">
                {isDragActive ? "Solte o arquivo aqui" : "Arraste um extrato PDF ou clique para selecionar"}
              </p>
              <p className="text-sm text-muted-foreground">Tamanho máximo: 10MB</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
