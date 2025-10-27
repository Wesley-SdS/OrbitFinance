import { GoalsList } from "@/components/goals-list"
import { getGoals } from "@/lib/queries"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export default async function GoalsListServer() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    return <div>User not authenticated</div>
  }

  const goals = await getGoals(session.user.id)

  return <GoalsList goals={goals} />
}