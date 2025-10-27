import { describe, it, expect } from 'vitest'
import { parseIntent, parseAmount, parseCategory, parseDateRelative } from '../../lib/assistant/nlu'

describe('NLU', () => {
  it('detects expense and amount/category', () => {
    const text = 'gastei 28,50 no mercado #alimentacao ontem'
    expect(parseIntent(text)).toEqual({ kind: 'LOG_EXPENSE' })
    expect(parseAmount(text)).toBe(28.5)
    expect(parseCategory(text)).toBe('alimentacao')
    const d = parseDateRelative(text, new Date('2024-05-10'))
    expect(d?.getDate()).toBe(9)
  })
  it('detects income', () => {
    const text = 'recebi 1200 salario #renda hoje'
    expect(parseIntent(text)).toEqual({ kind: 'LOG_INCOME' })
    expect(parseAmount(text)).toBe(1200)
  })
  it('detects report range', () => {
    const text = 'resumo mês'
    expect(parseIntent(text)).toEqual({ kind: 'REPORT', range: 'mes' })
  })
})

