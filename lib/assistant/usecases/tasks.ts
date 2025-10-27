import { PrismaTaskRepo, PrismaUserRepo } from '../../assistant/repositories'
import { parseDateRelative } from '../nlu'

export class CreateTask {
  constructor(private readonly users = new PrismaUserRepo(), private readonly repo = new PrismaTaskRepo()) {}
  async execute(input: { phone: string; text: string }) {
    const { id: userId } = await this.users.getOrCreateByPhone(input.phone)
    const dueAt = parseDateRelative(input.text)
    const text = input.text.replace(/criar tarefa/i, '').trim()
    const id = await this.repo.create({ userId, text, dueAt, priority: 'medium' })
    return { ok: true as const, message: `Tarefa criada (#${id.slice(0, 6)})` }
  }
}

export class ListTasks {
  constructor(private readonly users = new PrismaUserRepo(), private readonly repo = new PrismaTaskRepo()) {}
  async execute(input: { phone: string }) {
    const { id: userId } = await this.users.getOrCreateByPhone(input.phone)
    const tasks = await this.repo.listOpen(userId)
    if (tasks.length === 0) return { ok: true as const, message: 'Nenhuma tarefa aberta.' }
    const lines = tasks.map((t, i) => `${i + 1}. ${t.text}${t.dueAt ? ' (até ' + t.dueAt.toLocaleString('pt-BR') + ')' : ''}`)
    return { ok: true as const, message: lines.join('\n') }
  }
}

export class CompleteTask {
  constructor(private readonly users = new PrismaUserRepo(), private readonly repo = new PrismaTaskRepo()) {}
  async execute(input: { phone: string; text: string }) {
    const { id: userId } = await this.users.getOrCreateByPhone(input.phone)
    const m = input.text.match(/(\d+)/)
    if (!m) return { ok: false as const, message: 'Informe o índice da tarefa. Ex.: concluir tarefa 2' }
    const index = Number(m[1]) - 1
    const tasks = await this.repo.listOpen(userId)
    if (index < 0 || index >= tasks.length) return { ok: false as const, message: 'Índice inválido.' }
    await this.repo.complete(userId, tasks[index].id)
    return { ok: true as const, message: `Tarefa ${index + 1} concluída.` }
  }
}

