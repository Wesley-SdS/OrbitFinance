export class ReplyService {
  sendTextPlaceholder(_to: string, text: string) {
    return { ok: true as const, message: text }
  }
  static help() {
    return [
      'Exemplos:',
      '- gastei 28,50 mercado #alimentacao ontem',
      '- recebi 1200 salario #renda hoje',
      '- resumo mês',
      '- criar tarefa pagar água amanhã 10h',
      '- concluir tarefa 2',
      '- agenda hoje',
      '- lembrar amanhã 9h pagar cartão',
    ].join('\n')
  }
}

