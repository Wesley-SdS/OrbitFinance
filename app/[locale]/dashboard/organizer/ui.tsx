"use client"
import { useEffect, useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type InitialData = {
  tasks: any[]
  reminders: any[]
  events: any[]
}

export default function OrganizerClient({ initial }: { initial: InitialData }) {
  const [active, setActive] = useState("tasks")
  const [tasks, setTasks] = useState(initial.tasks)
  const [reminders, setReminders] = useState(initial.reminders)
  const [events, setEvents] = useState(initial.events)

  async function refresh(kind: "tasks" | "reminders" | "events") {
    if (kind === "tasks") {
      const res = await fetch("/api/tasks", { cache: "no-store" })
      const data = await res.json()
      if (data.ok) setTasks(data.tasks)
    } else if (kind === "reminders") {
      const res = await fetch("/api/reminders", { cache: "no-store" })
      const data = await res.json()
      if (data.ok) setReminders(data.reminders)
    } else {
      const now = new Date()
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString()
      const res = await fetch(`/api/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { cache: "no-store" })
      const data = await res.json()
      if (data.ok) setEvents(data.events)
    }
  }

  return (
    <Tabs value={active} onValueChange={setActive}>
      <TabsList>
        <TabsTrigger value="tasks">Tarefas</TabsTrigger>
        <TabsTrigger value="agenda">Agenda</TabsTrigger>
        <TabsTrigger value="reminders">Lembretes</TabsTrigger>
      </TabsList>

      <TabsContent value="tasks">
        <Card className="p-4 space-y-4">
          <TaskCreate onCreated={() => refresh("tasks")} />
          <TaskList items={tasks} onChanged={() => refresh("tasks")} />
        </Card>
      </TabsContent>

      <TabsContent value="agenda">
        <Card className="p-4 space-y-4">
          <EventCreate onCreated={() => refresh("events")} />
          <EventList items={events} />
        </Card>
      </TabsContent>

      <TabsContent value="reminders">
        <Card className="p-4 space-y-4">
          <ReminderCreate onCreated={() => refresh("reminders")} />
          <ReminderList items={reminders} />
        </Card>
      </TabsContent>
    </Tabs>
  )
}

function TaskCreate({ onCreated }: { onCreated: () => void }) {
  const [text, setText] = useState("")
  const [dueAt, setDueAt] = useState<string>("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, dueAt: dueAt || undefined }),
    })
    if (res.ok) {
      setText("")
      setDueAt("")
      onCreated()
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_220px_120px] items-end">
      <div>
        <Label>Descrição</Label>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: Pagar água" />
      </div>
      <div>
        <Label>Vence em</Label>
        <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
      </div>
      <Button type="submit">Criar tarefa</Button>
    </form>
  )
}

function TaskList({ items, onChanged }: { items: any[]; onChanged: () => void }) {
  async function complete(id: string) {
    const res = await fetch("/api/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: 'complete' }) })
    if (res.ok) onChanged()
  }
  return (
    <div className="space-y-2">
      {items.length === 0 && <div className="text-sm text-muted-foreground">Nenhuma tarefa aberta.</div>}
      {items.map((t: any) => (
        <div key={t.id} className="flex items-center justify-between border rounded-md p-2">
          <div>
            <div className="font-medium">{t.text}</div>
            {t.dueAt && <div className="text-xs text-muted-foreground">até {new Date(t.dueAt).toLocaleString('pt-BR')}</div>}
          </div>
          <Button size="sm" variant="secondary" onClick={() => complete(t.id)}>Concluir</Button>
        </div>
      ))}
    </div>
  )
}

function EventCreate({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("")
  const [startAt, setStartAt] = useState<string>("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, startAt }),
    })
    if (res.ok) {
      setTitle("")
      setStartAt("")
      onCreated()
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_220px_120px] items-end">
      <div>
        <Label>Título</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Dentista" />
      </div>
      <div>
        <Label>Início</Label>
        <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
      </div>
      <Button type="submit">Criar evento</Button>
    </form>
  )
}

function EventList({ items }: { items: any[] }) {
  return (
    <div className="space-y-2">
      {items.length === 0 && <div className="text-sm text-muted-foreground">Sem eventos no período.</div>}
      {items.map((e: any) => (
        <div key={e.id} className="flex items-center justify-between border rounded-md p-2">
          <div>
            <div className="font-medium">{e.title}</div>
            <div className="text-xs text-muted-foreground">{new Date(e.startAt).toLocaleString('pt-BR')}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ReminderCreate({ onCreated }: { onCreated: () => void }) {
  const [text, setText] = useState("")
  const [when, setWhen] = useState<string>("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, when }) })
    if (res.ok) {
      setText("")
      setWhen("")
      onCreated()
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_220px_120px] items-end">
      <div>
        <Label>Texto</Label>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: Pagar cartão" />
      </div>
      <div>
        <Label>Quando</Label>
        <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
      </div>
      <Button type="submit">Criar lembrete</Button>
    </form>
  )
}

function ReminderList({ items }: { items: any[] }) {
  return (
    <div className="space-y-2">
      {items.length === 0 && <div className="text-sm text-muted-foreground">Sem lembretes.</div>}
      {items.map((r: any) => (
        <div key={r.id} className="flex items-center justify-between border rounded-md p-2">
          <div>
            <div className="font-medium">{r.text}</div>
            <div className="text-xs text-muted-foreground">{new Date(r.when).toLocaleString('pt-BR')} — {r.status}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
