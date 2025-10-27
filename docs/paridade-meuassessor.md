# Paridade com Meu Assessor e Diferenciais

Este documento consolida um plano de paridade funcional com o Meu Assessor (com base em informações públicas visíveis) e propõe diferenciais para tornar o assistente um substituto completo de um funcionário administrativo via WhatsApp.

Aviso: o site aplica proteção anti-bot (desafio JS). A coleta automatizada foi limitada; valide os itens abaixo e envie complementos para refinarmos paridade fiel.

## Núcleo de Paridade
- Finanças via WhatsApp
  - Lançamentos por texto, áudio (STT) e foto (OCR) com anexos.
  - Categorias, correção/categorização posterior, recorrência e notas.
  - Relatórios/resumos por período e categoria; exportação CSV.
- Afazeres (To-dos)
  - Criar/listar/atualizar/concluir tarefas com datas e prioridade.
  - Lembretes por horário/offset (ex.: “amanhã 9h”).
- Compromissos (Agenda)
  - Criar/editar/listar compromissos; lembretes e recorrência.
  - Resumos da agenda do dia/semana.
- Conversação
  - Comandos simples e linguagem natural (datas relativas, valores, categorias).
  - Ajuda contextual e exemplos.

## Comandos Conversacionais (exemplos)
- Finanças
  - “gastei 28,50 no mercado #alimentacao ontem”
  - “recebi 1200 salario #renda hoje”
  - “resumo mês”, “gastos por categoria semana”, “exportar csv mês”
- Afazeres
  - “criar tarefa pagar água amanhã 10h #contas”
  - “listar tarefas hoje”, “concluir tarefa 3”
- Agenda
  - “marcar dentista 25/10 14:00”
  - “agenda hoje”, “agenda semana”, “cancelar dentista sexta”

## Diferenciais Propostos
- Multimodal evoluído
  - Extração enriquecida de cupons (total, itens, impostos) e voz (comandos contextuais).
- Inteligência financeira
  - Orçamento por categoria; metas; alertas de anomalias (gasto atípico).
  - Classificação automática de categoria por modelo leve.
- Produtividade
  - Tarefas e eventos recorrentes; templates pessoais (“fechamento mensal”).
  - Rotinas automáticas: ao receber “fatura cartão”, sugerir lançamento e lembrete.
- Observabilidade e confiabilidade
  - Idempotência, rastreabilidade por mensagem, filas para mídia/relatórios/lembretes.
- Integrações (opcional)
  - Google Calendar/Outlook (agenda), Google Drive/S3 (anexos), e-mail de exportações.

## Backlog Recomendado
1) MVP Paridade: texto → finanças, to-dos, agenda + relatórios curtos.
2) Mídia: OCR de cupom e STT de áudio com fallback para revisão.
3) Recorrências e lembretes confiáveis (jobs + templates WhatsApp).
4) Exportações (CSV/PDF) e links seguros.
5) Classificação automática e orçamentos (fase 2).
6) Integrações externas (calendário/drive) conforme demanda.

## Observações de Conformidade
- Para uso não-oficial do WhatsApp (Evolution/Zapster), avalie risco de bloqueio e termos de uso. Em produção, preferir a API oficial do WhatsApp Business.

