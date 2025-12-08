# PLANO DE IMPLEMENTAÇÃO - ORBITFINANCE IA FEATURES

## CONTEXTO DO PROJETO

**Stack:** Next.js 15, React 19, TypeScript, Prisma, PostgreSQL, Gemini 1.5 Flash + GPT-4o-mini, WhatsApp Evolution API, shadcn/ui, BullMQ + Redis.

**Modelos de IA (por caso de uso):**

| Caso de Uso | Modelo Principal | Fallback | Justificativa |
|-------------|------------------|----------|---------------|
| Extração de texto geral | Gemini 1.5 Flash | GPT-4o-mini | Rápido e barato |
| OCR de PDFs/Imagens | **Gemini 1.5 Pro** | Gemini Flash | Melhor precisão visual |
| Chat financeiro | Gemini 1.5 Flash | GPT-4o | Contexto longo |
| Insights complexos | GPT-4o | Gemini Pro | Raciocínio avançado |
| Análises simples | Gemini Flash | - | Custo mínimo |

**Configuração:** `lib/ai/models.ts` - Implementar router inteligente que escolhe modelo por tarefa.

---

## ARQUITETURA E PADRÕES OBRIGATÓRIOS

O projeto segue **Clean Architecture** com separação clara de responsabilidades:

```
lib/           → Business Logic (services, use cases)
app/api/       → Controllers (HTTP layer)
components/    → UI (presentation layer)
prisma/        → Data Access (repository pattern)
```

### Princípios OBRIGATÓRIOS:

**SOLID:**
- **S**ingle Responsibility: Cada arquivo/função faz UMA coisa
- **O**pen/Closed: Extensível sem modificar código existente
- **L**iskov Substitution: Interfaces consistentes
- **I**nterface Segregation: Interfaces pequenas e específicas
- **D**ependency Inversion: Depender de abstrações

**Clean Code:**
- Nomes descritivos e auto-explicativos
- Funções pequenas (max 20-30 linhas)
- Arquivos pequenos (max 200 linhas)
- **ZERO comentários poluentes** - código deve ser auto-documentado
- Comentários APENAS para explicar "porquê", nunca "o quê"
- Sem código morto ou comentado
- DRY (Don't Repeat Yourself)

**Estrutura de Services:**
```typescript
// ✅ CORRETO - Service focado
export class PdfExtractorService {
  async extract(buffer: Buffer): Promise<ExtractedData> { }
}

// ❌ ERRADO - God class
export class PdfService {
  extract() { }
  validate() { }
  save() { }
  notify() { }
}
```

**Estrutura de Componentes:**
```typescript
// ✅ CORRETO - Separação de concerns
// hooks/useStatementUpload.ts → lógica
// components/StatementUpload.tsx → UI pura

// ❌ ERRADO - Tudo junto
// components/StatementUpload.tsx com 500 linhas
```

**O que já funciona:**
- Dashboard completo com transações, contas, categorias, goals
- WhatsApp Assistant com NLU, OCR de imagens, STT de áudio
- Insights básicos com IA (5 tipos)
- Sistema de cache, rate limiting, jobs com BullMQ

---

## FEATURES PARA IMPLEMENTAR

### FEATURE 1: Upload de PDF + Extração de Extratos

> 🔴 **PRIORIDADE CRÍTICA** | Complexidade: Alta | Impacto: Alto

**Instalar:** `pnpm add pdf-parse react-dropzone @types/pdf-parse`

**Criar arquivos:**
- `lib/ai/pdf-extractor.ts` - Extrai texto do PDF e envia para Gemini
- `lib/utils/transaction-similarity.ts` - Detecta duplicatas
- `app/api/statements/upload/route.ts` - Recebe PDF, retorna JSON
- `app/api/statements/import/route.ts` - Salva transações selecionadas
- `app/[locale]/dashboard/import/page.tsx` - UI de upload
- `components/features/statement-upload.tsx` - Componente drag-drop

**Modificar:** `lib/assistant/inbound.ts` - Adicionar handler para `type === 'DOCUMENT'`

**Prompt Gemini para extração:**
```
Você é um especialista em extrair transações de extratos bancários brasileiros.

Analise este texto de PDF e retorne APENAS JSON válido:

${pdfText}

Formato obrigatório:
{
  "bank": "nome do banco",
  "period": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "descrição limpa sem códigos",
      "amount": -150.50,
      "type": "expense",
      "suggestedCategory": "alimentação"
    }
  ]
}

Regras:
- Valor negativo = despesa, positivo = receita
- Categorias: alimentação, transporte, moradia, saúde, lazer, educação, renda, outros
- Ignore cabeçalhos, totais, saldos - apenas transações
- Retorne SOMENTE o JSON, sem markdown
```

**Fluxo:**
1. Usuário arrasta PDF → POST /api/statements/upload
2. Backend extrai texto com pdf-parse → envia para Gemini
3. Retorna JSON com transações → Frontend mostra tabela com checkboxes
4. Usuário seleciona → POST /api/statements/import
5. Backend detecta duplicatas (data ±1 dia + valor igual + descrição similar)
6. Salva não-duplicatas → Retorna resumo

---

### FEATURE 2: Insights Avançados com Comparação de Investimentos

> 🔴 **PRIORIDADE CRÍTICA** | Complexidade: Alta | Impacto: Alto

**Criar arquivos:**
- `lib/ai/market-data.ts` - Dados de ações e taxas
- `lib/ai/insights-templates.ts` - Templates por tipo

**Modificar:**
- `prisma/schema.prisma` - Novos tipos no enum InsightType
- `lib/ai/models.ts` - Novo prompt
- `components/insights-list.tsx` - Renderizar novos tipos

**Novos tipos de insight:**
```prisma
enum InsightType {
  spending_pattern      // já existe
  saving_tip            // já existe
  budget_alert          // já existe
  goal_progress         // já existe
  general               // já existe
  investment_comparison // NOVO
  behavioral_pattern    // NOVO
  subscription_alert    // NOVO
  achievement           // NOVO
}
```

**Dados de mercado (lib/ai/market-data.ts):**
```typescript
export const MARKET_DATA = {
  cdi: 13.75,
  selic: 13.75,
  stocks: {
    COCA34: { price: 25, dividendYield: 3.2 },
    PETR4: { price: 35, dividendYield: 8.5 },
    ITUB4: { price: 30, dividendYield: 5.0 },
    BBAS3: { price: 28, dividendYield: 7.0 },
    VALE3: { price: 65, dividendYield: 6.0 },
  }
}
```

**Prompt Gemini para insights avançados:**
```
Você é o OrbiFinance AI, consultor financeiro brasileiro criativo e educativo.

DADOS DO USUÁRIO:
- Gastos por categoria (30 dias): ${JSON.stringify(spendingByCategory)}
- Total despesas: R$ ${totalExpense}
- Total receitas: R$ ${totalIncome}
- Saldo: R$ ${balance}
- Goals ativos: ${goals.length}

DADOS DE MERCADO:
- CDI: 13.75% a.a.
- Ações: COCA34 R$25, PETR4 R$35, ITUB4 R$30

GERE 4 INSIGHTS seguindo os tipos:

1. investment_comparison: Compare o maior gasto com investimentos
   Exemplo: "Você gastou R$450 em iFood. Com isso compraria 18 ações COCA34 que pagam R$14/ano em dividendos."

2. behavioral_pattern: Identifique padrões de comportamento
   Exemplo: "Você gasta 40% mais aos finais de semana. Economia potencial: R$300/mês."

3. subscription_alert: Se detectar gastos mensais fixos
   Exemplo: "Detectei 4 assinaturas: Netflix, Spotify, iCloud, Gym = R$180/mês = R$2.160/ano"

4. achievement: Algo positivo para celebrar
   Exemplo: "Parabéns! Seus gastos com delivery caíram 25% este mês."

Formato JSON obrigatório:
[
  {
    "type": "investment_comparison",
    "title": "Título curto (max 50 chars)",
    "content": "Mensagem educativa com números reais (max 300 chars)",
    "priority": "high",
    "emoji": "💡",
    "cta": { "text": "Ver detalhes", "action": "view_details" }
  }
]

Seja específico com valores. Use emojis. Não critique, inspire. Retorne SOMENTE JSON.
```

---

### FEATURE 3: Chat Financeiro

> 🔴 **PRIORIDADE CRÍTICA** | Complexidade: Alta | Impacto: Alto

**Criar arquivos:**
- `app/api/chat/route.ts` - Endpoint do chat
- `app/[locale]/dashboard/chat/page.tsx` - Página do chat
- `components/features/chat-interface.tsx` - UI do chat

**Prompt Gemini para chat:**
```
Você é o assistente financeiro do OrbiFinance. Responda de forma útil e com dados reais do usuário.

CONTEXTO DO USUÁRIO:
- Saldo total: R$ ${totalBalance}
- Receita mensal média: R$ ${avgIncome}
- Despesa mensal média: R$ ${avgExpense}
- Últimas transações: ${JSON.stringify(recentTransactions.slice(0, 20))}
- Goals: ${JSON.stringify(goals)}
- Top categorias: ${JSON.stringify(topCategories)}

PERGUNTA: ${userMessage}

Responda de forma:
- Direta e objetiva
- Com números específicos do usuário
- Sugerindo ações práticas
- Em português brasileiro

Se for pergunta sobre "quanto gastei com X", calcule dos dados fornecidos.
Se for simulação financeira, faça os cálculos.
Se não souber, diga que precisa de mais dados.
```

**Exemplos de perguntas que deve responder:**
- "quanto gastei com uber esse mês?"
- "qual meu maior gasto?"
- "consigo comprar um carro de 50 mil?"
- "devo parcelar em 12x ou pagar à vista?"
- "como estão minhas metas?"

---

### FEATURE 4: Análise de Assinaturas Recorrentes

> 🟠 **PRIORIDADE ALTA** | Complexidade: Média | Impacto: Alto

**Criar arquivos:**
- `lib/ai/recurrence-detector.ts` - Detecta padrões mensais
- `app/api/subscriptions/route.ts` - Lista assinaturas
- `components/features/subscription-list.tsx` - UI

**Lógica de detecção:**
```typescript
// Agrupa transações por descrição similar nos últimos 3 meses
// Se aparecer 2+ vezes com valor igual/próximo (±5%), é assinatura
// Retorna: nome, valor, frequência, custo anual
```

---

### FEATURE 5: Previsão de Fluxo de Caixa

> 🟠 **PRIORIDADE ALTA** | Complexidade: Alta | Impacto: Médio

**Criar arquivos:**
- `lib/ai/forecast-service.ts` - Calcula projeção
- `app/api/forecast/route.ts` - Retorna previsão

**Lógica:**
```typescript
// 1. Identifica receitas recorrentes (salário)
// 2. Identifica despesas recorrentes (aluguel, assinaturas)
// 3. Aplica sazonalidade: janeiro=IPVA+IPTU, dezembro=13º
// 4. Projeta saldo para próximos 3 meses
// 5. Alerta meses críticos (saldo < 0 ou < reserva emergência)
```

---

### FEATURE 6: Smart Alerts via WhatsApp

> 🟠 **PRIORIDADE ALTA** | Complexidade: Média | Impacto: Alto

**Criar arquivo:** `lib/ai/smart-alerts.ts`

**Tipos de alerta:**
- Gasto anormal: transação > 2x média da categoria
- Orçamento: atingiu 80% da meta de gastos
- Cobrança diferente: valor diferente do habitual em assinatura
- Duplicata: mesma transação em menos de 1 hora

**Integrar com:** `lib/assistant/dispatcher.ts` (já existe)

---

### FEATURE 7: Resumo Automático Semanal/Mensal

> 🟡 **PRIORIDADE MÉDIA** | Complexidade: Baixa | Impacto: Médio

**Criar arquivo:** `lib/jobs/workers/summary-worker.ts`

**Agendar:**
- Domingo 20h: resumo semanal
- Dia 1º 10h: resumo mensal

**Template resumo semanal:**
```
📊 Resumo da Semana

💰 Receitas: R$ ${income}
💸 Despesas: R$ ${expense}
📈 Saldo: R$ ${balance}

Top 3 gastos:
1. ${cat1}: R$ ${val1}
2. ${cat2}: R$ ${val2}
3. ${cat3}: R$ ${val3}

${insight}
```

---

### FEATURE 8: Score Financeiro

> 🟡 **PRIORIDADE MÉDIA** | Complexidade: Média | Impacto: Médio

**Criar arquivos:**
- `lib/ai/score-calculator.ts` - Calcula score
- `app/api/score/route.ts` - Retorna score

**Cálculo (0-1000):**
```typescript
const score =
  (gastosVsReceita < 0.7 ? 300 : 150) +     // 30%
  (temReservaEmergencia ? 250 : 0) +         // 25%
  (metasCumpridas / totalMetas * 200) +      // 20%
  (semPicosDeGasto ? 150 : 75) +             // 15%
  (temInvestimentos ? 100 : 0)               // 10%
```

---

### FEATURE 9: Desafios Semanais

> 🟡 **PRIORIDADE MÉDIA** | Complexidade: Média | Impacto: Médio

**Criar arquivos:**
- `lib/ai/challenge-generator.ts` - Gera desafios
- `app/api/challenges/route.ts` - CRUD

**Model Prisma:**
```prisma
model Challenge {
  id          String   @id @default(cuid())
  userId      String
  type        String   // "reduce_category", "save_amount", "no_spending"
  description String
  targetValue Decimal?
  status      String   @default("proposed") // proposed, accepted, completed, failed
  startDate   DateTime
  endDate     DateTime
  user        User     @relation(fields: [userId], references: [id])
}
```

**Exemplos de desafios:**
- "Reduzir delivery em 50% essa semana"
- "Guardar R$ 200 extras"
- "Semana sem compras por impulso"

---

### FEATURE 10: Feedback de Categorização

> 🟢 **PRIORIDADE BAIXA** | Complexidade: Baixa | Impacto: Baixo

**Model Prisma:**
```prisma
model CategoryFeedback {
  id                String   @id @default(cuid())
  userId            String
  description       String   // texto original
  originalCategory  String   // categoria que IA sugeriu
  correctedCategory String   // categoria que usuário corrigiu
  createdAt         DateTime @default(now())
  user              User     @relation(fields: [userId], references: [id])
}
```

**Modificar:** `lib/assistant/classifier.ts`
```typescript
// Antes de usar regras padrão, verificar se usuário já corrigiu essa descrição
const feedback = await db.categoryFeedback.findFirst({
  where: { userId, description: { contains: keyword } }
})
if (feedback) return feedback.correctedCategory
```

---

## MODELS PRISMA COMPLETOS PARA ADICIONAR

```prisma
// Adicionar ao schema.prisma

model Subscription {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  name        String
  amount      Decimal  @db.Decimal(15, 2)
  frequency   String   @default("monthly")
  category    String?
  lastCharge  DateTime @map("last_charge")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("subscriptions")
}

model FinancialScore {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  score     Int
  factors   Json
  createdAt DateTime @default(now()) @map("created_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("financial_scores")
}

model Challenge {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  type        String
  description String
  targetValue Decimal? @map("target_value") @db.Decimal(15, 2)
  currentValue Decimal? @map("current_value") @db.Decimal(15, 2)
  status      String   @default("proposed")
  startDate   DateTime @map("start_date")
  endDate     DateTime @map("end_date")
  createdAt   DateTime @default(now()) @map("created_at")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("challenges")
}

model CategoryFeedback {
  id                String   @id @default(cuid())
  userId            String   @map("user_id")
  description       String
  originalCategory  String   @map("original_category")
  correctedCategory String   @map("corrected_category")
  createdAt         DateTime @default(now()) @map("created_at")
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("category_feedbacks")
}

model ChatMessage {
  id        String   @id @default(cuid())
  sessionId String   @map("session_id")
  userId    String   @map("user_id")
  role      String   // "user" ou "assistant"
  content   String
  createdAt DateTime @default(now()) @map("created_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("chat_messages")
}

// Atualizar enum InsightType
enum InsightType {
  spending_pattern
  saving_tip
  budget_alert
  goal_progress
  general
  investment_comparison
  behavioral_pattern
  subscription_alert
  achievement
}
```

---

## ARQUIVOS A CRIAR (RESUMO)

```
lib/ai/
├── pdf-extractor.ts
├── market-data.ts
├── insights-templates.ts
├── recurrence-detector.ts
├── forecast-service.ts
├── score-calculator.ts
├── challenge-generator.ts
└── smart-alerts.ts

lib/utils/
└── transaction-similarity.ts

lib/jobs/workers/
└── summary-worker.ts

app/api/
├── statements/upload/route.ts
├── statements/import/route.ts
├── chat/route.ts
├── subscriptions/route.ts
├── forecast/route.ts
├── score/route.ts
├── challenges/route.ts
└── categories/feedback/route.ts

app/[locale]/dashboard/
├── import/page.tsx
├── chat/page.tsx
└── subscriptions/page.tsx

components/features/
├── statement-upload.tsx
├── chat-interface.tsx
├── subscription-list.tsx
├── score-card.tsx
├── challenge-card.tsx
└── forecast-chart.tsx
```

---

## ORDEM DE IMPLEMENTAÇÃO (POR PRIORIDADE)

### 🔴 PRIORIDADE CRÍTICA (Implementar primeiro)

| # | Feature | Complexidade | Impacto | Justificativa |
|---|---------|--------------|---------|---------------|
| 1 | **PDF Upload + Extração** | Alta | Alto | Feature mais pedida, core do produto |
| 2 | **Insights Avançados** | Alta | Alto | Diferencial competitivo, valor educacional |
| 3 | **Chat Financeiro** | Alta | Alto | Experiência conversacional única |

### 🟠 PRIORIDADE ALTA

| # | Feature | Complexidade | Impacto | Justificativa |
|---|---------|--------------|---------|---------------|
| 4 | **Análise de Assinaturas** | Média | Alto | Valor imediato, economia real |
| 5 | **Smart Alerts** | Média | Alto | Proatividade, engajamento |
| 6 | **Previsão de Fluxo** | Alta | Médio | Planejamento financeiro |

### 🟡 PRIORIDADE MÉDIA

| # | Feature | Complexidade | Impacto | Justificativa |
|---|---------|--------------|---------|---------------|
| 7 | **Score Financeiro** | Média | Médio | Gamificação, engajamento |
| 8 | **Resumo Automático** | Baixa | Médio | Engajamento passivo |
| 9 | **Desafios Semanais** | Média | Médio | Gamificação |

### 🟢 PRIORIDADE BAIXA

| # | Feature | Complexidade | Impacto | Justificativa |
|---|---------|--------------|---------|---------------|
| 10 | **Feedback Categorização** | Baixa | Baixo | Melhoria contínua |

---

## REGRAS IMPORTANTES

1. **IA:** Sempre usar Gemini primeiro, GPT-4o-mini como fallback
2. **Reutilizar:** file-validation.ts, rate-limit.ts, cached.ts, dispatcher.ts
3. **Padrões:** Seguir estrutura existente do projeto
4. **i18n:** Adicionar traduções em pt, en, es
5. **Testes:** Vitest para services principais
6. **Segurança:** Validar uploads, sanitizar inputs, auth em tudo
