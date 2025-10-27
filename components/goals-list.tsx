import type React from "react"
import { Button } from "@/components/ui/button"
import { Link } from "@/lib/navigation"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, decimalToNumber, calculatePercentage } from "@/lib/utils"
import type { Goal } from "@/lib/types"
import { useTranslations } from "next-intl"

interface GoalsListProps {
  goals: Goal[]
  onDelete?: (id: string) => Promise<void>
}

export function GoalsList({ goals, onDelete }: GoalsListProps) {
  const t = useTranslations()

  const handleDelete = async (id: string) => {
    if (onDelete) {
      await onDelete(id)
    }
  }

  if (goals.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{t("goals.noGoals")}</p>
        <p className="text-muted-foreground mt-2 text-sm">{t("goals.startAdding")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => {
        const progress = calculatePercentage(goal.currentAmount, goal.targetAmount)
        const isOverdue = goal.deadline && new Date(goal.deadline) < new Date()

        return (
          <div key={goal.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{goal.name}</h3>
                {goal.category && (
                  <Badge variant="outline">
                    {goal.category}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/goals/${goal.id}/edit`}>
                    {t("common.edit")}
                  </Link>
                </Button>
                {onDelete && (
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(goal.id)}>
                    {t("common.delete")}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("goals.progress")}</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full ${
                    progress >= 100 ? "bg-green-600" : isOverdue ? "bg-red-600" : "bg-blue-600"
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>

            <div className="text-muted-foreground flex justify-between text-sm">
              <span>
                {formatCurrency(decimalToNumber(goal.currentAmount))} /{" "}
                {formatCurrency(decimalToNumber(goal.targetAmount))}
              </span>
              {goal.deadline && (
                <span className={isOverdue ? "text-red-600" : ""}>
                  {t("goals.deadline")}: {new Date(goal.deadline).toLocaleDateString()}
                </span>
              )}
            </div>

            {progress >= 100 && <Badge className="bg-green-100 text-green-800">{t("goals.completed")}</Badge>}
          </div>
        )
      })}
    </div>
  )
}