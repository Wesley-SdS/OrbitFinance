import { parse as parseDate, isValid, subDays, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type Intent =
  | { kind: 'LOG_EXPENSE' }
  | { kind: 'LOG_INCOME' }
  | { kind: 'REPORT'; range?: 'hoje' | 'semana' | 'mes' | 'ano' }
  | { kind: 'TASK_CREATE' }
  | { kind: 'TASK_LIST' }
  | { kind: 'TASK_COMPLETE'; index?: number }
  | { kind: 'AGENDA_SUMMARY'; range?: 'hoje' | 'semana' }
  | { kind: 'AGENDA_CREATE' }
  | { kind: 'REMINDER_CREATE' }
  | { kind: 'HELP' }

const expenseRe = /\b(gastei|paguei|custou|comprei|saiu|foi|despesa|gasto|pagar|preciso gastar|vou gastar|tenho que pagar|devo pagar)\b/i
const incomeRe = /\b(recebi|ganhei|entrou|renda|salario|sal[áa]rio|cr[ée]dito|pagamento recebido|receita)\b/i
const reportRe = /\b(resumo|relat[óo]rio|gastos por categoria|quanto gastei|total de gastos|balan[çc]o|extrato)\b/i
const taskCreateRe = /\b(criar tarefa|nova tarefa|adicionar tarefa|tarefa nova)\b/i
const taskListRe = /\b(listar tarefas|tarefas hoje|tarefas|minhas tarefas|ver tarefas)\b/i
const taskCompleteRe = /\b(concluir tarefa|finalizar tarefa|completar tarefa|tarefa feita|marcar como feita)\b/i
const agendaRe = /\b(agenda|marcar|agendar|compromisso|evento|reuni[ãa]o)\b/i
const lembrarRe = /\b(lembrar|lembrete|avisar|aviso)\b/i

export function parseIntent(text: string): Intent {
  const t = text.trim().toLowerCase()
  if (expenseRe.test(t)) return { kind: 'LOG_EXPENSE' }
  if (incomeRe.test(t)) return { kind: 'LOG_INCOME' }
  if (reportRe.test(t)) {
    if (t.includes('hoje')) return { kind: 'REPORT', range: 'hoje' }
    if (t.includes('semana')) return { kind: 'REPORT', range: 'semana' }
    if (t.includes('mês') || t.includes('mes')) return { kind: 'REPORT', range: 'mes' }
    if (t.includes('ano')) return { kind: 'REPORT', range: 'ano' }
    return { kind: 'REPORT' }
  }
  if (taskCreateRe.test(t)) return { kind: 'TASK_CREATE' }
  if (taskListRe.test(t)) return { kind: 'TASK_LIST' }
  if (taskCompleteRe.test(t)) return { kind: 'TASK_COMPLETE' }
  if (lembrarRe.test(t)) return { kind: 'REMINDER_CREATE' }
  if (agendaRe.test(t)) {
    if (t.includes('hoje')) return { kind: 'AGENDA_SUMMARY', range: 'hoje' }
    if (t.includes('semana')) return { kind: 'AGENDA_SUMMARY', range: 'semana' }
    return { kind: 'AGENDA_CREATE' }
  }
  return { kind: 'HELP' }
}

export function parseAmount(text: string): number | null {
  // Match patterns: "50", "50.00", "50,00", "1.500", "1.500,00", "R$ 50"
  // Prioritize formats with thousands separator
  const withSep = text.match(/(?:r\$\s*)?(\d{1,3}(?:[.,]\d{3})+)(?:[.,](\d{2}))?/i)
  if (withSep) {
    // Format: 1.500,00 or 1,500.00
    const intPart = withSep[1].replace(/[.,]/g, '')
    const frac = withSep[2] ?? '00'
    const val = Number(intPart) + Number(frac) / 100
    if (Number.isFinite(val) && val > 0 && val <= 1000000) {
      return Math.round(val * 100) / 100
    }
  }

  // No separator - simple number
  const simple = text.match(/(?:r\$\s*)?(\d+)(?:[.,](\d{2}))?/i)
  if (simple) {
    const intPart = simple[1]
    const frac = simple[2] ?? '00'
    const val = Number(intPart) + Number(frac) / 100
    if (Number.isFinite(val) && val > 0 && val <= 1000000) {
      return Math.round(val * 100) / 100
    }
  }

  return null
}

export function parseCategory(text: string): string | null {
  const m = text.match(/#([\p{L}\d_-]+)/u)
  return m ? m[1].toLowerCase() : null
}

export function parseDescription(text: string): string | undefined {
  let t = text
    .replace(expenseRe, '') // Remove keywords like "gastei", "paguei"
    .replace(incomeRe, '') // Remove keywords like "recebi", "ganhei"
    .replace(/(?:r\$\s*)?(\d{1,3}(?:[\.,]\d{3})*|\d+)(?:[\.,]\d{2})?\s*(?:reais?|real)?/gi, '') // Remove amounts and "reais"
    .replace(/#[\p{L}\d_-]+/gu, '') // Remove categories with hashtag
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
  return t || undefined
}

export function parseDateRelative(text: string, now = new Date()): Date | null {
  const t = text.toLowerCase()
  if (t.includes('hoje')) return now
  if (t.includes('ontem')) return subDays(now, 1)
  if (t.includes('amanhã') || t.includes('amanha')) return addDays(now, 1)

  const d1 = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?:\s+(\d{1,2}):(\d{2}))?\b/)
  if (d1) {
    const dd = d1[1]
    const mm = d1[2]
    const yyyy = d1[3]
    const hh = d1[4]
    const min = d1[5]
    const year = yyyy ? Number(yyyy.length === 2 ? '20' + yyyy : yyyy) : now.getFullYear()
    const dateStr = dd + '/' + mm + '/' + year + (hh ? ' ' + hh + ':' + min : '')
    const fmt = hh ? 'd/M/yyyy H:m' : 'd/M/yyyy'
    const parsed = parseDate(dateStr, fmt, now, { locale: ptBR })
    return isValid(parsed) ? parsed : null
  }
  return null
}

export function normalizePhone(input: string): string {
  return input.replace(/\D/g, '')
}

export function extractRange(text: string): { from: Date; to: Date } | null {
  const now = new Date()
  const t = text.toLowerCase()
  if (t.includes('hoje')) {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    return { from, to }
  }
  if (t.includes('semana')) {
    const day = now.getDay() || 7
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day - 1))
    const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7)
    return { from, to }
  }
  if (t.includes('mês') || t.includes('mes')) {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return { from, to }
  }
  if (t.includes('ano')) {
    const from = new Date(now.getFullYear(), 0, 1)
    const to = new Date(now.getFullYear() + 1, 0, 1)
    return { from, to }
  }
  return null
}

