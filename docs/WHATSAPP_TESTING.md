# 🧪 Guia de Testes - WhatsApp Integration

## 📋 Índice

1. [Testes Unitários](#-testes-unitários)
2. [Testes Locais do Webhook](#-testes-locais-do-webhook)
3. [Testes com WhatsApp Real](#-testes-com-whatsapp-real)
4. [Verificação de Resultados](#-verificação-de-resultados)
5. [Troubleshooting](#-troubleshooting)

---

## ✅ Testes Unitários

### 1. Testar NLU (Natural Language Understanding)

```bash
# Testa parsing de mensagens
pnpm test tests/lib/nlu.test.ts
```

**O que é testado:**
- ✅ Detecção de despesa: "gastei 28,50 no mercado #alimentacao ontem"
- ✅ Detecção de receita: "recebi 1200 salario #renda hoje"
- ✅ Detecção de relatório: "resumo mês"
- ✅ Extração de valores
- ✅ Extração de categorias (#alimentacao)
- ✅ Parsing de datas relativas (hoje, ontem, amanhã)

### 2. Testar Job Queue (Lembretes)

```bash
# Testa sistema de agendamento de lembretes
pnpm test tests/lib/jobs/queue.test.ts
```

**O que é testado:**
- ✅ Agendamento de lembretes futuros
- ✅ Execução imediata de lembretes atrasados
- ✅ Sistema de retry com backoff exponencial
- ✅ Múltiplos lembretes independentes
- ✅ Métricas da fila
- ✅ Graceful shutdown

### 3. Rodar Todos os Testes

```bash
# Roda todos os 102 testes
pnpm test

# Com cobertura
pnpm test:coverage
```

---

## 🌐 Testes Locais do Webhook

### Pré-requisitos

1. **Servidor rodando**:
   ```bash
   pnpm dev
   ```

2. **Banco de dados configurado**:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

3. **Usuário de teste criado** (com número de WhatsApp):
   - Crie um usuário no sistema
   - Configure o campo `phone` na tabela `users`
   - Exemplo: `5511999999999`

### Opção 1: Script PowerShell (Windows)

```powershell
# Rodar o script de teste
.\scripts\test-whatsapp-webhook.ps1
```

**O script testa:**
1. ✅ Mensagem de despesa
2. ✅ Mensagem de receita
3. ✅ Criação de lembrete
4. ✅ Solicitação de resumo

### Opção 2: Script Bash (Linux/Mac)

```bash
# Dar permissão de execução
chmod +x scripts/test-whatsapp-webhook.sh

# Rodar o script
./scripts/test-whatsapp-webhook.sh
```

### Opção 3: cURL Manual

#### Teste 1: Registrar Despesa

```bash
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "15550000000",
            "phone_number_id": "PHONE_NUMBER_ID"
          },
          "contacts": [{
            "profile": {
              "name": "Test User"
            },
            "wa_id": "5511999999999"
          }],
          "messages": [{
            "from": "5511999999999",
            "id": "wamid.test123",
            "timestamp": "1673024400",
            "text": {
              "body": "gastei 50 no mercado #alimentacao"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

**Resultado esperado:**
```json
{
  "status": "ok"
}
```

#### Teste 2: Registrar Receita

```bash
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [{
        "value": {
          "messages": [{
            "from": "5511999999999",
            "id": "wamid.test124",
            "timestamp": "1673024400",
            "text": {
              "body": "recebi 2000 salario #renda"
            },
            "type": "text"
          }]
        }
      }]
    }]
  }'
```

#### Teste 3: Criar Lembrete

```bash
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [{
        "value": {
          "messages": [{
            "from": "5511999999999",
            "id": "wamid.test125",
            "timestamp": "1673024400",
            "text": {
              "body": "me lembre de pagar conta de luz amanha 14h"
            },
            "type": "text"
          }]
        }
      }]
    }]
  }'
```

#### Teste 4: Solicitar Resumo

```bash
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [{
        "value": {
          "messages": [{
            "from": "5511999999999",
            "id": "wamid.test126",
            "timestamp": "1673024400",
            "text": {
              "body": "resumo mes"
            },
            "type": "text"
          }]
        }
      }]
    }]
  }'
```

### Opção 4: Postman/Insomnia

1. **Criar nova requisição POST**
2. **URL**: `http://localhost:3000/api/webhooks/whatsapp`
3. **Headers**:
   ```
   Content-Type: application/json
   ```
4. **Body** (raw JSON):
   ```json
   {
     "object": "whatsapp_business_account",
     "entry": [{
       "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
       "changes": [{
         "value": {
           "messages": [{
             "from": "5511999999999",
             "text": {
               "body": "gastei 50 no mercado #alimentacao"
             },
             "type": "text"
           }]
         }
       }]
     }]
   }
   ```

---

## 📱 Testes com WhatsApp Real

### Pré-requisitos

1. **Meta Business Account** configurado
2. **WhatsApp Business API** ativo
3. **Webhook configurado** no Meta for Developers
4. **Servidor exposto publicamente** (via ngrok ou similar)

### Setup com ngrok

1. **Instalar ngrok**:
   ```bash
   # Windows (via Chocolatey)
   choco install ngrok

   # Mac (via Homebrew)
   brew install ngrok

   # Linux
   snap install ngrok
   ```

2. **Expor servidor local**:
   ```bash
   ngrok http 3000
   ```

   Você receberá uma URL como:
   ```
   https://abc123.ngrok.io
   ```

3. **Configurar webhook no Meta**:
   - Acesse [Meta for Developers](https://developers.facebook.com/)
   - Vá em seu app WhatsApp Business
   - Configure Webhook:
     - **Callback URL**: `https://abc123.ngrok.io/api/webhooks/whatsapp`
     - **Verify Token**: O valor do seu `.env` (`WHATSAPP_VERIFY_TOKEN`)
     - **Webhook Fields**: Marque `messages`

4. **Testar pelo WhatsApp real**:

   Envie mensagens para o número do WhatsApp Business:

   ```
   gastei 50 no mercado #alimentacao
   ```

   ```
   recebi 2000 salario #renda
   ```

   ```
   me lembre de pagar conta de luz amanha 14h
   ```

   ```
   resumo mes
   ```

---

## 🔍 Verificação de Resultados

### 1. Verificar Logs do Servidor

No terminal onde `pnpm dev` está rodando, você deve ver:

```
[WhatsApp] Message received from 5511999999999: gastei 50 no mercado #alimentacao
[NLU] Detected intent: LOG_EXPENSE
[NLU] Amount: 50
[NLU] Category: alimentacao
[DB] Transaction created: { id: '...', type: 'expense', amount: 50 }
[WhatsApp] Response sent: Despesa de R$ 50,00 registrada! 💸
```

### 2. Verificar no Banco de Dados

#### Via Prisma Studio

```bash
npx prisma studio
```

Verifique as tabelas:
- **Transaction**: Deve ter a nova transação
- **Reminder**: Deve ter o novo lembrete (se criou um)
- **User**: Deve mostrar o usuário com o phone

#### Via SQL Direto

```bash
# Conectar ao banco
psql -d orbifinance

# Ver transações recentes
SELECT * FROM "Transaction" ORDER BY "createdAt" DESC LIMIT 5;

# Ver lembretes
SELECT * FROM "Reminder" ORDER BY "scheduledAt" DESC LIMIT 5;
```

### 3. Verificar via Dashboard

1. Acesse `http://localhost:3000/dashboard/transactions`
2. Verifique se a transação aparece na lista
3. Verifique se o saldo da conta foi atualizado

### 4. Verificar Job Queue (Lembretes)

Se você tem **Redis configurado**:

```bash
# Instalar Redis CLI
redis-cli

# Ver jobs na fila
KEYS *reminders*

# Ver detalhes de um job
HGETALL bull:reminders:1
```

Se **não tem Redis** (modo de desenvolvimento):
- Lembretes serão logados mas não executados
- Configure Redis para testes completos de lembretes

---

## 🐛 Troubleshooting

### Problema: "User not found"

**Causa**: Não existe usuário com o número de WhatsApp no banco.

**Solução**:
```sql
-- Atualizar usuário existente
UPDATE "User" SET phone = '5511999999999' WHERE email = 'test@example.com';

-- Ou criar novo usuário via Prisma Studio
```

### Problema: "Category not found"

**Causa**: A categoria mencionada não existe.

**Solução**:
```bash
# Rodar seed para criar categorias padrão
npx prisma db seed
```

Ou criar manualmente:
```sql
INSERT INTO "Category" (id, name, type, icon, color, "userId")
VALUES (gen_random_uuid(), 'alimentacao', 'expense', '🍽️', '#ef4444', '<USER_ID>');
```

### Problema: "Account not found"

**Causa**: O usuário não tem uma conta padrão.

**Solução**:
```sql
-- Criar conta padrão para o usuário
INSERT INTO "FinancialAccount" (id, name, type, balance, currency, "userId")
VALUES (gen_random_uuid(), 'Conta Principal', 'checking', 1000, 'BRL', '<USER_ID>');
```

### Problema: Webhook não recebe mensagens

**Verificações**:

1. **Servidor rodando?**
   ```bash
   curl http://localhost:3000/api/webhooks/whatsapp
   ```

2. **ngrok funcionando?**
   ```bash
   curl https://abc123.ngrok.io/api/webhooks/whatsapp
   ```

3. **Webhook verificado no Meta?**
   - Deve aparecer um ✅ verde no painel

4. **Token correto?**
   - Verifique `.env`: `WHATSAPP_VERIFY_TOKEN`

### Problema: Mensagem recebida mas não processada

**Debug**:

1. **Verificar logs detalhados**:
   ```typescript
   // Em lib/assistant/providers/whatsapp.ts
   console.log('Full webhook payload:', JSON.stringify(body, null, 2))
   ```

2. **Verificar formato da mensagem**:
   - WhatsApp envia formato específico
   - Verifique se `body.entry[0].changes[0].value.messages` existe

3. **Testar NLU isoladamente**:
   ```bash
   pnpm test tests/lib/nlu.test.ts
   ```

### Problema: Rate limit excedido

**Causa**: Muitas mensagens em pouco tempo.

**Solução**:
```typescript
// Em lib/assistant/webhook-rate-limit.ts
// Ajustar limites temporariamente para testes

export const rateLimitConfig = {
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests (aumentado para testes)
}
```

---

## 📊 Checklist de Testes

### Testes Básicos
- [ ] Servidor rodando em `http://localhost:3000`
- [ ] Banco de dados migrado e seeded
- [ ] Usuário de teste criado com número de WhatsApp
- [ ] Todos os testes unitários passando (102/102)

### Testes de Webhook Local
- [ ] Teste 1: Registrar despesa ✅
- [ ] Teste 2: Registrar receita ✅
- [ ] Teste 3: Criar lembrete ✅
- [ ] Teste 4: Solicitar resumo ✅
- [ ] Transação aparece no banco de dados
- [ ] Transação aparece no dashboard
- [ ] Saldo da conta atualizado

### Testes com WhatsApp Real
- [ ] ngrok configurado e rodando
- [ ] Webhook verificado no Meta for Developers
- [ ] Mensagem de texto simples recebida
- [ ] Mensagem com categoria (#tag) processada
- [ ] Mensagem com data relativa (ontem, hoje) processada
- [ ] Lembrete criado e agendado
- [ ] Resumo mensal retornado

### Testes de Edge Cases
- [ ] Mensagem sem valor numérico
- [ ] Mensagem sem categoria
- [ ] Valor com vírgula (28,50)
- [ ] Valor com ponto (28.50)
- [ ] Múltiplas mensagens simultâneas
- [ ] Mensagem de usuário não cadastrado

---

## 🚀 Próximos Passos

Após validar os testes locais:

1. **Deploy em produção**:
   - Vercel, Railway, ou outro hosting
   - Configurar variáveis de ambiente
   - Atualizar webhook URL no Meta

2. **Monitoramento**:
   - Configurar Sentry para erros
   - Configurar logs estruturados (Pino)
   - Métricas de uso do WhatsApp

3. **E2E Testing**:
   - Implementar testes automatizados com Playwright
   - Ver [TEST_COVERAGE_ROADMAP.md](./TEST_COVERAGE_ROADMAP.md)

---

## 📚 Recursos Adicionais

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Webhook Security](https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests)
- [NLU Testing Best Practices](https://wit.ai/docs/recipes/testing)
- [BullMQ Queue Testing](https://docs.bullmq.io/guide/testing)

---

**Última Atualização**: 11 de Janeiro de 2025
