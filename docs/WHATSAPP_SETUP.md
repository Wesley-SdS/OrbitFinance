# WhatsApp Integration Setup Guide

Este guia fornece instruções completas para configurar e deploy da integração WhatsApp do OrbiFinance MVP usando Evolution API.

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração da Evolution API](#configuração-da-evolution-api)
3. [Configuração do Projeto](#configuração-do-projeto)
4. [Configuração do Redis](#configuração-do-redis)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Deploy](#deploy)
7. [Testes](#testes)
8. [Monitoramento](#monitoramento)
9. [Troubleshooting](#troubleshooting)

## Pré-requisitos

Antes de começar, certifique-se de ter:

- Node.js 18+ instalado
- pnpm instalado (`npm install -g pnpm`)
- Redis server (local ou remoto)
- Conta WhatsApp Business (ou número pessoal para testes)
- Servidor Evolution API (auto-hospedado ou cloud)

## Configuração da Evolution API

### Opção 1: Docker (Recomendado)

```bash
# Clone o repositório da Evolution API
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Configure as variáveis de ambiente
cp .env.example .env

# Edite o .env com suas configurações
nano .env

# Inicie com Docker Compose
docker-compose up -d
```

### Opção 2: Cloud (Easypanel, Railway, etc.)

1. Acesse [Evolution API Docs](https://doc.evolution-api.com)
2. Siga o guia de deploy para sua plataforma
3. Anote a URL base e token de API

### Criar Instância WhatsApp

1. Acesse a Evolution API Manager UI (geralmente em `http://localhost:8080`)
2. Crie uma nova instância
3. Escaneie o QR Code com WhatsApp
4. Anote o nome da instância e token

## Configuração do Projeto

### 1. Instalar Dependências

```bash
cd orbifinance-mvp
pnpm install
```

### 2. Configurar Banco de Dados

```bash
# Rodar migrations
npx prisma migrate deploy

# Seed com categorias padrão
npx prisma db seed
```

## Configuração do Redis

### Local (Docker)

```bash
docker run -d \\
  --name redis-orbi \\
  -p 6379:6379 \\
  redis:7-alpine
```

### Cloud (Upstash, Redis Cloud, etc.)

1. Crie uma instância Redis
2. Copie a connection string
3. Adicione ao `.env` como `REDIS_URL`

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/orbifinance"

# Evolution API
EVOLUTION_API_BASE_URL="http://localhost:8080"
EVOLUTION_API_SESSION="orbifinance-session"
EVOLUTION_API_TOKEN="sua-api-key-aqui"

# Webhook Security
WA_VERIFY_SIGNATURE=true
WA_REQUIRE_TOKEN=true
WA_WEBHOOK_TOKEN="webhook-secret-token-123"
WA_SIGNATURE_SECRET="hmac-secret-key-456"

# Redis (para rate limiting e jobs)
REDIS_URL="redis://localhost:6379"

# AI APIs (opcional)
GEMINI_API_KEY="sua-gemini-key"
OPENAI_API_KEY="sua-openai-key"

# Logging
LOG_LEVEL="info"  # debug | info | warn | error
NODE_ENV="production"

# Metrics (opcional)
METRICS_ENDPOINT="https://metrics.example.com/api/v1/push"
METRICS_API_KEY="metrics-api-key"
```

## Deploy

### Passo 1: Build da Aplicação

```bash
pnpm build
```

### Passo 2: Iniciar Worker de Background Jobs

O worker processa lembretes agendados e outras tarefas assíncronas.

```bash
# Desenvolvimento
pnpm tsx scripts/start-worker.ts

# Produção
node dist/scripts/start-worker.js
```

**Dica:** Use PM2 para gerenciar processos em produção:

```bash
# Instalar PM2
npm install -g pm2

# Iniciar worker
pm2 start dist/scripts/start-worker.js --name orbi-worker

# Salvar configuração
pm2 save

# Setup auto-start
pm2 startup
```

### Passo 3: Configurar Webhook na Evolution API

Configure o webhook para receber mensagens do WhatsApp:

```bash
curl -X POST 'http://localhost:8080/webhook/set' \\
  -H 'Content-Type: application/json' \\
  -H 'apikey: SUA_API_KEY' \\
  -d '{
    "url": "https://seu-dominio.com/api/webhooks/whatsapp",
    "enabled": true,
    "webhookByEvents": false,
    "webhookBase64": false,
    "headers": {
      "Authorization": "Bearer webhook-secret-token-123"
    }
  }'
```

### Passo 4: Testar Webhook

```bash
# Enviar mensagem de teste
curl -X POST 'http://localhost:3000/api/webhooks/whatsapp' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer webhook-secret-token-123' \\
  -d '{
    "event": "messages.upsert",
    "data": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false,
        "id": "TEST123"
      },
      "message": {
        "conversation": "gastei 50 reais #alimentacao almoço"
      }
    }
  }'
```

## Testes

### Unit Tests

```bash
pnpm test
```

### Integration Tests

```bash
pnpm test tests/lib/assistant
```

### E2E Test (WhatsApp Real)

1. Envie mensagem para o número conectado:
   ```
   gastei 50 reais #alimentacao almoço
   ```

2. Verifique resposta confirmando transação

3. Teste lembrete:
   ```
   lembrar amanhã 9h pagar conta
   ```

4. Teste relatório:
   ```
   resumo do mês
   ```

## Monitoramento

### Logs

Os logs são estruturados em JSON (formato Pino):

```bash
# Ver logs em tempo real
pm2 logs orbi-worker --lines 100

# Logs da aplicação Next.js
pm2 logs orbifinance --lines 100
```

### Métricas

Métricas disponíveis:

- `webhook_requests_total` - Total de webhooks recebidos
- `transactions_created_total` - Transações criadas
- `reminders_scheduled_total` - Lembretes agendados
- `ai_insights_generated_total` - Insights gerados

Para visualizar métricas:

1. Configure `METRICS_ENDPOINT` no `.env`
2. As métricas serão enviadas automaticamente a cada minuto

### Health Checks

```bash
# Verificar status da aplicação
curl http://localhost:3000/api/health

# Verificar status do worker
curl http://localhost:3000/api/health/worker

# Verificar Redis
redis-cli ping
```

## Troubleshooting

### Problema: Webhook não recebe mensagens

**Solução:**

1. Verifique se a URL do webhook está acessível publicamente:
   ```bash
   curl https://seu-dominio.com/api/webhooks/whatsapp
   ```

2. Verifique logs da Evolution API:
   ```bash
   docker logs evolution-api
   ```

3. Confirme que o webhook está configurado:
   ```bash
   curl 'http://localhost:8080/webhook/find' \\
     -H 'apikey: SUA_API_KEY'
   ```

### Problema: Rate Limit Exceeded

**Solução:**

1. Verifique se Redis está rodando:
   ```bash
   redis-cli ping
   ```

2. Limpe rate limits:
   ```bash
   redis-cli KEYS "webhook:ratelimit:*" | xargs redis-cli DEL
   ```

3. Ajuste limites no código (`lib/assistant/webhook-rate-limit.ts`)

### Problema: Lembretes não são enviados

**Solução:**

1. Verifique se o worker está rodando:
   ```bash
   pm2 list
   ```

2. Verifique logs do worker:
   ```bash
   pm2 logs orbi-worker --lines 50
   ```

3. Verifique jobs na fila do Redis:
   ```bash
   redis-cli KEYS "bull:reminders:*"
   ```

4. Reinicie o worker:
   ```bash
   pm2 restart orbi-worker
   ```

### Problema: Assinatura Inválida

**Solução:**

1. Verifique se `WA_SIGNATURE_SECRET` está correto no `.env`

2. Temporariamente desabilite verificação de assinatura:
   ```env
   WA_VERIFY_SIGNATURE=false
   ```

3. Verifique formato da assinatura nos headers:
   ```typescript
   // Deve ser: sha256=<hash>
   console.log(request.headers.get('x-signature'))
   ```

### Problema: Parse de valores incorreto

**Solução:**

1. Teste o parser diretamente:
   ```typescript
   import { parseAmount } from '@/lib/assistant/nlu'
   console.log(parseAmount('gastei 50 reais')) // Deve retornar 50
   ```

2. Veja exemplos válidos:
   - `"50"` → 50.00
   - `"50,00"` → 50.00
   - `"R$ 50"` → 50.00
   - `"1.500,00"` → 1500.00

## Arquitetura

```
┌─────────────┐
│  WhatsApp   │
│   Business  │
└──────┬──────┘
       │
       ↓
┌─────────────────┐
│ Evolution API   │ ← QR Code, Mensagens
│ (WhatsApp SDK)  │
└──────┬──────────┘
       │ Webhook
       ↓
┌────────────────────────┐
│ OrbiFinance MVP        │
│  /api/webhooks/whatsapp│
└────────┬───────────────┘
         │
    ┌────┴────┐
    │         │
    ↓         ↓
┌────────┐ ┌───────────┐
│ NLU    │ │ Security  │
│ Parser │ │ Validator │
└───┬────┘ └───────────┘
    │
    ↓
┌──────────────┐
│  Use Cases   │
│ - Log Trans  │
│ - Reminder   │
│ - Report     │
└──────┬───────┘
       │
   ┌───┴────┐
   │        │
   ↓        ↓
┌──────┐ ┌────────┐
│ Prisma│ │ BullMQ │
│  DB   │ │ +Redis │
└───────┘ └────────┘
```

## Próximos Passos

Após configurar o MVP:

1. ✅ Testar todos os fluxos principais
2. ✅ Configurar backups do Redis
3. ✅ Implementar Meta Cloud API oficial (após aprovação)
4. ✅ Adicionar mais categorias inteligentes
5. ✅ Implementar análises financeiras avançadas
6. ✅ Criar dashboard web de relatórios

## Suporte

Para dúvidas ou problemas:

1. Verifique a [documentação da Evolution API](https://doc.evolution-api.com)
2. Revise os logs da aplicação
3. Abra uma issue no repositório

---

**Última atualização:** 2025-11-10
**Versão:** 1.0.0-MVP
