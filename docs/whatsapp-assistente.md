# Assistente Financeiro no WhatsApp — Guia de Implementação

Este guia descreve como transformar o projeto em um assistente pessoal completo via WhatsApp para lançar despesas/receitas, enviar cupons e fotos, registrar por áudio, pedir relatórios, criar lembretes e gerenciar agenda. Focado em Clean Code, SOLID e SRP, com camadas claras, baixo acoplamento e alto coesão.

## Objetivos
- Registrar transações por texto, foto e áudio.
- Consultar saldo, resumos e relatórios (período/categoria).
- Receber lembretes e gerenciar agenda.
- Operar no WhatsApp com segurança, resiliência e auditabilidade.

## Visão Geral da Arquitetura
- Interface: WhatsApp (Cloud API do Meta, Twilio, 360dialog ou Gupshup).
- BFF/Webhook: endpoint HTTP que recebe mensagens do WhatsApp e responde.
- Domínio: casos de uso (aplicação) e entidades (negócio).
- Infra: adaptadores para WhatsApp, STT (áudio→texto), OCR (imagem→texto), NLU (intenção), Storage, Scheduler e Repositórios (DB).
- Worker/Jobs: processamento assíncrono para mídia, relatórios e lembretes.

Camadas (SRP):
- Domain: `Transaction`, `Category`, `Reminder`, `User`.
- Application (Use Cases): `LogTransaction`, `GenerateReport`, `ScheduleReminder`, `GetAgenda`, `CategorizeTransaction`.
- Infra (Adapters): `WhatsAppProvider`, `SpeechToTextProvider`, `OcrProvider`, `StorageProvider`, `Scheduler`, `TransactionRepository`, `UserRepository`, `AttachmentRepository`.
- Interface: `WebhookController` (inbound) e `ReplyService` (outbound).

## Fluxos Principais
### 1) Texto: “gastei 2 reais na padaria”
1. WhatsApp → Webhook recebe mensagem.
2. Parser/NLU identifica intenção `LogExpense` e extrai valor, descrição, data, categoria.
3. `LogTransaction` cria transação despesa.
4. `ReplyService` confirma: “Lançado: -R$ 2,00 • padaria • hoje”.

### 2) Foto de cupom/nota
1. Mensagem contém imagem → baixar mídia via provider.
2. `OcrProvider` extrai texto; parser detecta valor/data/estabelecimento.
3. `LogTransaction` cria transação e vincula `Attachment`.
4. Resposta: “Cupom lido e lançado: -R$ 24,90 • mercado”.

### 3) Áudio: “paguei Uber 18 reais ontem”
1. Baixar áudio.
2. `SpeechToTextProvider` transcreve.
3. Parser processa texto e chama `LogTransaction`.
4. Resposta com resumo e categoria sugerida.

### 4) Relatórios
- Comando: “relatório mês”, “resumo semana”, “gastos por categoria janeiro”.
- `GenerateReport` agrega dados e retorna resumo e, opcionalmente, CSV.

### 5) Lembretes e Agenda
- “lembrar amanhã 9h pagar cartão”, “agenda hoje”.
- `ScheduleReminder` cria lembrete; `Scheduler` agenda job para envio via template aprovado.
- `GetAgenda` lista próximos eventos/lembretes.

## Design (Clean Code, SOLID, SRP)
- Interfaces por capacidade, não por implementação.
- Use Cases orquestram regras; Adapters lidam com I/O.
- Dependências apontam para dentro (Domain não conhece Infra).
- Idempotência em webhooks e jobs (dedup por `providerMessageId`).
- Erros como valores: tipos específicos (ex.: `InvalidAmountError`).

## Integrações e Provedores
- WhatsApp Provider: Meta Cloud API (oficial) ou Twilio/360dialog/Gupshup.
  - Sessões de 24h para respostas livre; proativos exigem template aprovado.
  - Validação de assinatura e verificação do webhook.
- STT: Whisper (OpenAI), Faster-Whisper (self-host), Google STT.
- OCR: Tesseract (local), Google Vision, AWS Textract.
- Storage: S3, GCS ou disco local em dev.
- Scheduler/Jobs: BullMQ (Redis), Cloud Run Jobs, Temporal.io, ou cron do provedor.

### Integração WhatsApp Não-Oficial (Evolution/Zapster)
- Para desenvolvimento ou cenários sem API oficial, é possível usar Evolution API (open source) ou provedores como Zapster.
- Riscos: violação de termos e possível bloqueio de número; avalie antes de usar em produção.
- Veja `docs/integracao-whatsapp-nao-oficial.md` para setup e adaptação dos adapters.

## Modelagem de Dados (Prisma — sugestão)
```prisma
model User {
  id           String  @id @default(cuid())
  phone        String  @unique
  name         String?
  createdAt    DateTime @default(now())
  transactions Transaction[]
  reminders    Reminder[]
  messages     MessageLog[]
}

model Transaction {
  id          String   @id @default(cuid())
  userId      String
  type        TransactionType
  amount      Decimal  @db.Decimal(18,2)
  currency    String   @default("BRL")
  occurredAt  DateTime
  description String?
  categoryId  String?
  createdAt   DateTime @default(now())
  attachments Attachment[]
  user        User     @relation(fields: [userId], references: [id])
  category    Category? @relation(fields: [categoryId], references: [id])
}

enum TransactionType { INCOME EXPENSE }

model Category {
  id    String @id @default(cuid())
  name  String @unique
}

model Attachment {
  id            String @id @default(cuid())
  transactionId String
  kind          AttachmentKind
  url           String
  providerId    String?
  createdAt     DateTime @default(now())
  transaction   Transaction @relation(fields: [transactionId], references: [id])
}

enum AttachmentKind { IMAGE AUDIO PDF }

model Reminder {
  id        String   @id @default(cuid())
  userId    String
  text      String
  when      DateTime
  status    ReminderStatus @default(PENDING)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

enum ReminderStatus { PENDING SENT CANCELED }

model MessageLog {
  id         String   @id @default(cuid())
  userId     String
  providerId String?  @unique
  direction  MessageDirection
  type       MessageType
  content    String?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
}

enum MessageDirection { INBOUND OUTBOUND }

enum MessageType { TEXT IMAGE AUDIO DOCUMENT }
```

## Contratos (Interfaces) — exemplos em TypeScript
```ts
export interface WhatsAppProvider {
  verifySignature(rawBody: Buffer, headers: Record<string,string>): boolean
  parseInbound(body: unknown): InboundMessage
  sendText(to: string, text: string): Promise<void>
  sendTemplate(to: string, name: string, vars: string[]): Promise<void>
  getMedia(url: string): Promise<{ buffer: Buffer; mime: string }>
}

export interface SpeechToTextProvider {
  transcribe(input: Buffer, mime: string): Promise<string>
}

export interface OcrProvider {
  extractText(image: Buffer, mime: string): Promise<string>
}

export interface StorageProvider {
  put(path: string, data: Buffer, mime: string): Promise<string> // retorna URL
}

export interface Scheduler {
  schedule(id: string, runAt: Date, payload: object): Promise<void>
}

export interface TransactionRepository {
  create(input: CreateTransactionDTO): Promise<Transaction>
  listByPeriod(userId: string, from: Date, to: Date): Promise<Transaction[]>
}
```

## Casos de Uso (exemplos)
```ts
class LogTransaction {
  constructor(
    private readonly repo: TransactionRepository,
  ) {}

  async execute(input: {
    userId: string; type: 'INCOME' | 'EXPENSE'; amount: number;
    occurredAt: Date; description?: string; categoryName?: string;
    attachment?: { url: string; kind: 'IMAGE' | 'AUDIO' | 'PDF' }
  }) {
    // validações de domínio e criação (SRP no caso de uso)
    return this.repo.create(/* ... */)
  }
}

class GenerateReport {
  constructor(private readonly repo: TransactionRepository) {}
  async execute(userId: string, range: { from: Date; to: Date }) {
    const txs = await this.repo.listByPeriod(userId, range.from, range.to)
    // agregações e totais por categoria
    return {/* resumo, totais, categorias */}
  }
}
```

## Webhook (Next.js app router — sugestão)
- Rota: `app/api/whatsapp/webhook/route.ts`.
- GET: verificação de token (setup WhatsApp Cloud API).
- POST: valida assinatura, parseia mensagem e envia para orquestrador.

Pseudocódigo:
```ts
export async function POST(req: Request) {
  const raw = await req.arrayBuffer()
  if (!whats.verifySignature(Buffer.from(raw), Object.fromEntries(req.headers))) return new Response('forbidden', { status: 403 })
  const inbound = whats.parseInbound(JSON.parse(Buffer.from(raw).toString('utf8')))
  await inboundRouter.handle(inbound) // delega por tipo: TEXT, IMAGE, AUDIO
  return new Response('ok')
}
```

## Roteador de Mensagens
- TEXT → `parseCommandOrNLU()` → `LogTransaction | GenerateReport | ScheduleReminder | Help`.
- IMAGE → baixar → OCR → parse → `LogTransaction`.
- AUDIO → baixar → STT → parse → `LogTransaction`.
- Fallback: mensagem de ajuda com exemplos.

## Parser de Linguagem Natural (simples e extensível)
Regras iniciais (sem dependência pesada):
- Expressões: “gastei|paguei|custou” → `EXPENSE`; “recebi|ganhei|entrou” → `INCOME`.
- Valor: padrões `R$ 12,34` ou `12.34` ou `12,34`.
- Data relativa: “hoje”, “ontem”, “amanhã”, “semana passada”.
- Categoria por hashtag: “padaria #alimentacao”.

Estruture em funções puras testáveis:
```ts
parseIntent(text: string): Intent
parseAmount(text: string, locale='pt-BR'): number | null
parseDateRelative(text: string, now=new Date()): Date | null
parseCategory(text: string): string | null
```

## Comandos Úteis (via WhatsApp)
- Lançamentos:
  - “gastei 2,00 na padaria #alimentacao ontem”
  - “recebi 1200 salario #renda”
  - Envie foto do cupom/nota para OCR.
  - Envie áudio descrevendo a compra para STT.
- Relatórios:
  - “resumo hoje|semana|mês|ano”
  - “relatório jan 2025”, “gastos por categoria mês”
  - “exportar csv mês” (enviar link/arquivo)
- Organização:
  - “categorizar 123 #transporte” (por id curto do lançamento)
  - “listar últimos 5”
- Lembretes/Agenda:
  - “lembrar amanhã 09:00 pagar cartão”
  - “agenda hoje|amanhã|semana”

## Mensagens e Templates (WhatsApp)
- Dentro da janela de 24h de sessão: respostas livres.
- Mensagens proativas (lives fora da janela) exigem template aprovado.
- Crie templates: `lembrete_pagamento`, `relatorio_pronto` e use variáveis curtas.

## Segurança e Confiabilidade
- Valide assinatura do provedor no webhook.
- Idempotência: dedupe por `providerMessageId` em `MessageLog`.
- Rate limiting por remetente (telefone).
- PII: criptografe tokens e dados sensíveis; `.env` seguro.
- Logs estruturados (correlation-id por mensagem) e trilha de auditoria.

## Jobs Assíncronos
- Fila `media-processing`: baixar mídia, OCR/STT, criar transação.
- Fila `reports`: gerar CSV/PDF e entregar link.
- Fila `reminders`: disparo de templates no horário agendado.
- Reprocessamento com backoff e dead-letter.

## Configuração — Passo a Passo
1) Conta WhatsApp Business (Cloud API) ou provedor equivalente.
   - Obtenha `VERIFY_TOKEN`, `WHATSAPP_TOKEN`, `PHONE_NUMBER_ID`.
   - Configure Webhook URL pública (use ngrok em desenvolvimento).
2) Ambiente
   - Node 18+, PNPM, Redis (se usar BullMQ), banco (Postgres/MySQL/SQLite).
   - Variáveis `.env` (exemplos):
     - `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`
     - `STT_PROVIDER`, `OCR_PROVIDER`
     - `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET`
     - `DATABASE_URL`, `REDIS_URL`
3) Banco
   - Ajuste modelos Prisma e rode `prisma migrate dev`.
4) Webhook
   - Crie rota `app/api/whatsapp/webhook/route.ts` com GET/POST.
   - Valide assinatura e teste verificação com o provedor.
5) Providers
   - Implemente adapters WhatsApp, STT, OCR, Storage seguindo interfaces.
6) Roteador/Use Cases
   - Implemente parser e casos de uso mínimos (`LogTransaction`, `GenerateReport`).
7) Jobs
   - Configure filas e workers para mídia, relatórios e lembretes.
8) Testes
   - Unit: parser, casos de uso, adapters fake.
   - E2E: sandbox/prod test do WhatsApp Cloud API.
9) Observabilidade
   - Logs estruturados e alertas para falhas em filas/webhook.

## Respostas Exemplos (UX)
- Sucesso lançamento: “Lançado: -R$ 28,50 • padaria • ontem • #alimentacao”
- Dúvida: “Não encontrei o valor. Ex.: ‘gastei 12,90 no mercado’”
- Relatório: “Mês atual: -R$ 1.240,35 | +R$ 6.200,00 • Alimentação -R$ 420,50”
- Lembrete criado: “Ok! Vou te lembrar 21/10 às 09:00: pagar cartão.”

## Dicas de Manutenibilidade
- Nomeie funções e classes pelo propósito do domínio.
- Funções puras para parsing e conversões.
- Objetos de valor (Money, DateRange) para reduzir erros.
- Evite estados globais; injete dependências.
- Limite tamanho de arquivos; uma classe/arquivo por responsabilidade.

## Implantação
- Webhook pode rodar em serverless (cuidado com cold start e limites de payload de mídia).
- Workers em ambiente com execução contínua (Render, Railway, Fly.io, ECS).
- Armazenamento de mídia em S3/GCS; não sirva mídia sensível publicamente.

## Roadmap de Evolução
- Classificador de categoria por ML a partir de descrição/estabelecimento.
- Reconciliação com extratos bancários (Open Finance/Plaid)
- Exportações contábeis e multi-moeda.
- Multiusuários por empresa e papéis.

---

Com esta estrutura, você terá um assistente no WhatsApp robusto, extensível e testável. O segredo é manter as camadas separadas, casos de uso coesos e adapters finos para provedores. Comece simples (texto), adicione mídia (foto/áudio), depois relatórios e lembretes.
