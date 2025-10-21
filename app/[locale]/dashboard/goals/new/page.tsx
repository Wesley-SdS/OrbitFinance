import { GoalForm } from "@/components/goal-form"

export default function NewGoalPage() {
  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Goal</h1>
        <p className="text-muted-foreground">Set a new financial goal to track your progress</p>
      </div>

      <GoalForm />
    </div>
  )
}
