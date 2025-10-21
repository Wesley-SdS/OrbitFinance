"use client"

import { useEffect, useState } from "react"
import { GoalForm } from "@/components/goal-form"
import type { Goal } from "@prisma/client"

export function GoalEditLoader({ id }: { id: string }) {
  const [goal, setGoal] = useState<Goal | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/goals/${id}`, { cache: "no-store" })
        if (!res.ok) return setGoal(null)
        const json = await res.json()
        setGoal(json.goal as Goal)
      } catch {
        setGoal(null)
      }
    }
    load()
  }, [id])

  if (goal === null) return <div className="p-4 text-center">Loading...</div>

  return <GoalForm goal={goal} />
}

