import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { getTasksCached, getRemindersCached, getEventsRangeCached } from "@/lib/cached"
import OrganizerClient from "./ui"

export default async function OrganizerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await getSession()
  if (!session?.user) redirect(`/${locale}/auth/login`)
  const userId = session.user.id
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7)
  const [tasks, reminders, events] = await Promise.all([
    getTasksCached(userId),
    getRemindersCached(userId),
    getEventsRangeCached(userId, from.toISOString(), to.toISOString()),
  ])
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Organizador</h1>
      <OrganizerClient initial={{ tasks, reminders, events }} />
    </div>
  )
}

