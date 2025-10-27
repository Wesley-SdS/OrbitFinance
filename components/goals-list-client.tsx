"use client"

import { useState } from "react"
import { useSession } from "@/lib/auth-client"
import { GoalsList } from "@/components/goals-list"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

export function GoalsListClient({ initialGoals }: { initialGoals: any[] }) {
  const [goals, setGoals] = useState(initialGoals)
  const { data: session } = useSession()
  const t = useTranslations()

  const handleDelete = async (id: string) => {
    if (!session) return

    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete goal")
      
      setGoals(prev => prev.filter(goal => goal.id !== id))
      toast.success(t("goals.deleted"))
    } catch (error) {
      console.error("Failed to delete goal:", error)
      toast.error(t("goals.deleteError"))
    }
  }

  return <GoalsList goals={goals} onDelete={handleDelete} />
}