"use client"

import { useEffect, useState } from "react"
import type { AiInsight } from "@prisma/client"
import { InsightsList } from "@/components/insights-list"

export function InsightsListLoader() {
  const [insights, setInsights] = useState<AiInsight[] | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/insights", { cache: "no-store" })
        if (!res.ok) return setInsights([])
        const json = await res.json()
        setInsights(json.insights as AiInsight[])
      } catch {
        setInsights([])
      }
    }
    load()
  }, [])

  if (!insights) return <div className="p-4 text-center">Loading...</div>

  return <InsightsList insights={insights} />
}

