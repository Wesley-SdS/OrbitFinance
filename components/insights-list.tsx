"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AiInsight } from "@prisma/client"
import { useTranslations } from "next-intl"

export function InsightsList({ insights }: { insights: AiInsight[] }) {
  const [localInsights, setLocalInsights] = useState<AiInsight[]>(insights)
  const t = useTranslations()

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/insights/${id}/read`, {
        method: "PATCH",
      })
      if (response.ok) {
        setLocalInsights((prev) => prev.map((insight) => (insight.id === id ? { ...insight, isRead: true } : insight)))
      }
    } catch (error) {
      console.error("Failed to mark insight as read:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/insights/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setLocalInsights((prev) => prev.filter((insight) => insight.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete insight:", error)
    }
  }

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case "spending_pattern":
        return "bg-blue-100 text-blue-800"
      case "saving_tip":
        return "bg-green-100 text-green-800"
      case "budget_alert":
        return "bg-red-100 text-red-800"
      case "goal_progress":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (localInsights.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{t("insights.noInsights")}</p>
        <p className="text-muted-foreground mt-2 text-sm">{t("insights.startGenerating")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {localInsights.map((insight) => (
        <div
          key={insight.id}
          className={`space-y-3 rounded-lg border p-4 ${!insight.isRead ? "border-blue-200 bg-blue-50" : ""}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Badge className={getInsightTypeColor(insight.insightType)}>
                  {insight.insightType === "spending_pattern"
                    ? t("insights.types.spending")
                    : insight.insightType === "saving_tip"
                    ? t("insights.types.saving")
                    : insight.insightType === "budget_alert"
                    ? t("insights.types.budget")
                    : t("insights.types.goal")}
                </Badge>
                {!insight.isRead && <Badge variant="secondary">{t("common.new")}</Badge>}
              </div>
              <h3 className="mb-2 font-medium">{insight.title}</h3>
              <p className="text-muted-foreground text-sm">{insight.content}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-xs">{new Date(insight.createdAt).toLocaleDateString()}</div>
            <div className="flex gap-2">
              {!insight.isRead && (
                <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(insight.id)}>
                  {t("insights.markAsRead")}
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={() => handleDelete(insight.id)}>
                {t("common.delete")}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
