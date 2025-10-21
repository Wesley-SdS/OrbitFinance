"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileDown } from "lucide-react"
import { useTranslations } from "next-intl"

interface ExportReportFormProps {
  format: "csv" | "pdf"
}

export function ExportReportForm({ format }: ExportReportFormProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [type, setType] = useState("all")
  const [isExporting, setIsExporting] = useState(false)
  const t = useTranslations()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        type,
      })

      const response = await fetch(`/api/export/${format}?${params}`, {
        method: "GET",
      })

      if (!response.ok) throw new Error(t("reports.exporting"))

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `orbifinance-report-${new Date().toISOString().split("T")[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Export error:", error)
      alert(t("common.error"))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="start-date">{t("reports.startDate")}</Label>
        <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="end-date">{t("reports.endDate")}</Label>
        <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">{t("reports.transactionType")}</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("reports.allTransactions")}</SelectItem>
            <SelectItem value="income">{t("reports.incomeOnly")}</SelectItem>
            <SelectItem value="expense">{t("reports.expensesOnly")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleExport} disabled={isExporting || !startDate || !endDate} className="w-full">
        <FileDown className="mr-2 h-4 w-4" />
        {isExporting ? t("reports.exporting") : t(`reports.${format}`)}
      </Button>
    </div>
  )
}
