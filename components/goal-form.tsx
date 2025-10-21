"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, decimalToNumber, calculatePercentage } from "@/lib/utils"
import type { Goal } from "@prisma/client"
import { useTranslations } from "next-intl"

export function GoalForm({ goal, onSuccess }: { goal?: Goal; onSuccess?: () => void }) {
  const [name, setName] = useState(goal?.name || "")
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount?.toString() || "")
  const [currentAmount, setCurrentAmount] = useState(goal?.currentAmount?.toString() || "0")
  const [deadline, setDeadline] = useState(goal?.deadline ? new Date(goal.deadline).toISOString().split("T")[0] : "")
  const [isCompleted, setIsCompleted] = useState(goal?.isCompleted ?? false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()
  const t = useTranslations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!session) throw new Error(t("auth.login"))

      const goalData = {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount),
        deadline: deadline ? new Date(deadline) : null,
        category: "savings",
        color: "#10b981",
        icon: "target",
        isCompleted,
        userId: session.user.id,
      }

      if (goal?.id) {
        const res = await fetch(`/api/goals/${goal.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(goalData),
        })
        if (!res.ok) throw new Error(t("common.error"))
      } else {
        const res = await fetch(`/api/goals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(goalData),
        })
        if (!res.ok) throw new Error(t("common.error"))
      }

      onSuccess?.()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t("common.error"))
    } finally {
      setIsLoading(false)
    }
  }

  const progress = goal?.targetAmount ? calculatePercentage(goal.currentAmount, goal.targetAmount) : 0

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">{t("goals.name")}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("goals.name")}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="targetAmount">{t("goals.targetAmount")}</Label>
        <Input
          id="targetAmount"
          type="number"
          step="0.01"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          placeholder="1000.00"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="currentAmount">{t("goals.currentAmount")}</Label>
        <Input
          id="currentAmount"
          type="number"
          step="0.01"
          value={currentAmount}
          onChange={(e) => setCurrentAmount(e.target.value)}
          placeholder="0.00"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="deadline">{t("goals.deadline")}</Label>
        <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="isCompleted" checked={isCompleted} onCheckedChange={setIsCompleted} />
        <Label htmlFor="isCompleted">{t("goals.completed")}</Label>
      </div>

      {goal && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t("goals.progress")}</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? t("common.loading") : goal ? t("goals.edit") : t("goals.new")}
      </Button>
    </form>
  )
}

export function GoalsList() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { data: session } = useSession()

  useEffect(() => {
    if (session) {
      fetchGoals()
    }
  }, [session])

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/goals", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load goals")
      const data = await res.json()
      setGoals(data.goals as Goal[])
    } catch (error) {
      console.error("Failed to fetch goals:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete goal")
      fetchGoals()
    } catch (error) {
      console.error("Failed to delete goal:", error)
      toast?.error?.("Failed to delete goal")
    }
  }

  if (isLoading) {
    return <div className="p-4 text-center">Loading goals...</div>
  }

  if (goals.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No goals found</p>
        <p className="text-muted-foreground mt-2 text-sm">
          Create your first financial goal to start tracking your progress
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => {
        const progress = calculatePercentage(goal.currentAmount, goal.targetAmount)
        const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !goal.isCompleted

        return (
          <div key={goal.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{goal.name}</h3>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(goal.id)}>
                  Delete
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full ${
                    goal.isCompleted ? "bg-green-600" : isOverdue ? "bg-red-600" : "bg-blue-600"
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
                  Due: {new Date(goal.deadline).toLocaleDateString()}
                </span>
              )}
            </div>

            {goal.isCompleted && <Badge className="bg-green-100 text-green-800">Completed</Badge>}
          </div>
        )
      })}
    </div>
  )
}
