<div align="center">

# 💰 OrbitFinance

**Plataforma de Finanças Pessoais com IA**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.3-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tests](https://img.shields.io/badge/Tests-102%20passing-success)](./tests)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

[Recursos](#-recursos) • [Arquitetura](#-arquitetura) • [Instalação](#-instalação) • [Testes](#-testes) • [Documentação](#-documentação)

</div>

---

## 📋 Sobre o Projeto

OrbitFinance é uma plataforma moderna de gestão financeira pessoal com insights gerados por IA, integração WhatsApp para registro de transações via mensagem, e suporte completo a múltiplos idiomas.

### 🎯 Principais Recursos

- 💬 **Assistente WhatsApp** - Registre transações via mensagens naturais
- 🤖 **Insights com IA** - Análises financeiras personalizadas com Anthropic Claude
- 📊 **Dashboard Interativo** - Visualizações e gráficos em tempo real
- 🌍 **Multilíngue** - Suporte para Português, Inglês e Espanhol
- 📱 **Responsivo** - Design adaptável para mobile e desktop
- 🔐 **Autenticação Segura** - Better Auth com suporte a OAuth (Google, GitHub)
- ⚡ **Performance** - Server Components, cache otimizado, streaming
- 🧪 **102 Testes** - Cobertura completa com Vitest

---

## 🏗️ Arquitetura

### Stack Tecnológico

```
┌─────────────────────────────────────────────────┐
│              Frontend (Next.js 15)               │
│  ┌──────────────────────────────────────────┐   │
│  │  React 19 + Server Components             │   │
│  │  Tailwind CSS 4 + shadcn/ui               │   │
│  │  next-intl (i18n) + Recharts              │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│              Backend (API Routes)                │
│  ┌──────────────────────────────────────────┐   │
│  │  Better Auth (Autenticação)               │   │
│  │  Prisma ORM (PostgreSQL)                  │   │
│  │  BullMQ (Job Queue - Lembretes)           │   │
│  │  Redis (Cache + Queue)                    │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│            Integrações Externas                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Anthropic Claude (IA)                    │   │
│  │  Evolution API (WhatsApp)                 │   │
│  │  OAuth Providers (Google, GitHub)         │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### 📁 Estrutura de Pastas

```
orbifinance-mvp/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # Rotas internacionalizadas
│   │   ├── auth/                 # Páginas de autenticação
│   │   ├── dashboard/            # Dashboard (protegido)
│   │   └── api/                  # API Routes por idioma
│   └── api/                      # API Routes globais
├── components/                   # Componentes React
│   ├── ui/                       # shadcn/ui components
│   ├── auth/                     # Componentes de autenticação
│   ├── features/                 # Features (Hero, etc)
│   └── charts/                   # Gráficos (Recharts)
├── lib/                          # Utilitários e lógica
│   ├── assistant/                # Sistema WhatsApp Assistant
│   │   ├── nlu.ts               # Processamento linguagem natural
│   │   ├── dispatcher.ts        # Orquestração de mensagens
│   │   ├── usecases/            # Casos de uso (log, remind)
│   │   └── providers/           # Provedores WhatsApp
│   ├── jobs/                     # BullMQ workers
│   ├── ai/                       # Integração Anthropic
│   ├── auth.ts                   # Better Auth config
│   ├── prisma.ts                 # Prisma client
│   └── queries/                  # Database queries
├── prisma/                       # Prisma schema e migrations
├── tests/                        # Testes (Vitest)
│   ├── components/               # Testes de componentes
│   ├── lib/                      # Testes de lógica
│   └── setup.ts                  # Setup dos testes
├── messages/                     # Traduções (i18n)
│   ├── pt.json
│   ├── en.json
│   └── es.json
├── docs/                         # Documentação técnica
└── docker-compose.yml            # Infraestrutura local
```

### 🎨 Design Patterns

- **Clean Architecture** - Separação de camadas (UI, Casos de Uso, Dados)
- **SOLID Principles** - Código manutenível e testável
- **Repository Pattern** - Abstração de acesso a dados
- **Use Cases** - Lógica de negócio isolada
- **Dependency Injection** - Baixo acoplamento

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ e pnpm
- PostgreSQL 14+
- Redis 7+ (para jobs e cache)
- Docker (opcional, para infraestrutura local)

### 1. Clone o repositório

```bash
git clone https://github.com/Wesley-SdS/OrbitFinance.git
cd OrbitFinance
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/orbifinance_dev"

# Auth
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth (opcional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Anthropic AI
ANTHROPIC_API_KEY="your-anthropic-key"

# Redis
REDIS_URL="redis://localhost:6379"

# WhatsApp (Evolution API)
EVOLUTION_API_URL="http://localhost:8080"
EVOLUTION_API_KEY="your-api-key"
```

### 4. Configure o banco de dados

```bash
# Executar migrations
pnpm prisma migrate dev

# (Opcional) Seed com dados de exemplo
pnpm prisma db seed
```

### 5. Inicie a aplicação

**Desenvolvimento:**
```bash
pnpm dev
```

**Produção:**
```bash
pnpm build
pnpm start
```

### 6. (Opcional) Inicie a infraestrutura com Docker

```bash
docker-compose up -d
```

Isso iniciará:
- PostgreSQL (porta 5432)
- Redis (porta 6379)
- Evolution API (porta 8080)

---

## 🧪 Testes

### Executar todos os testes

```bash
pnpm test
```

### Testes com cobertura

```bash
pnpm test:coverage
```

### Estrutura dos Testes

```
tests/
├── components/              # Testes de componentes React
│   ├── transaction-form.test.tsx
│   ├── account-form.test.tsx
│   └── ...
├── lib/                     # Testes de lógica/utilitários
│   ├── nlu.test.ts          # NLU do WhatsApp Assistant
│   ├── assistant/
│   │   ├── webhook.test.ts
│   │   └── usecases/
│   └── jobs/
└── setup.ts                 # Configuração global
```

### Métricas de Cobertura

| Categoria | Cobertura |
|-----------|-----------|
| **Statements** | 85% |
| **Branches** | 78% |
| **Functions** | 82% |
| **Lines** | 85% |

**Total:** 102 testes passando ✅

---

## 📚 Documentação

### Guias Técnicos

- [🐋 Docker Setup](./docs/DOCKER_SETUP.md) - Configuração de infraestrutura local
- [💬 WhatsApp Integration](./docs/WHATSAPP_INTEGRATION_GUIDE.md) - Integração WhatsApp Assistant
- [🧪 Test Coverage Roadmap](./docs/TEST_COVERAGE_ROADMAP.md) - Plano de testes
- [⚡ Performance Guide](./docs/levantamento-completo.md) - Otimizações e boas práticas
- [🔐 OAuth Setup](./docs/oauth-setup-guide.md) - Configuração Google/GitHub OAuth

### WhatsApp Assistant

O OrbitFinance possui um assistente inteligente via WhatsApp que permite:

**Exemplos de uso:**
```
"gastei 50 reais em alimentação"
→ Registra despesa de R$ 50 na categoria Alimentação

"recebi 3000 de salário"
→ Registra receita de R$ 3000 na categoria Salário

"me lembra de pagar conta amanhã às 14h"
→ Agenda lembrete para amanhã 14:00

"resumo do mês"
→ Envia resumo financeiro do mês atual
```

**Configuração:** Veja [WhatsApp Setup](./docs/WHATSAPP_SETUP.md)

---

## 🛠️ Scripts Úteis

```bash
# Desenvolvimento
pnpm dev                    # Inicia servidor dev (localhost:3000)
pnpm build                  # Build de produção
pnpm start                  # Inicia servidor de produção

# Qualidade de Código
pnpm lint                   # ESLint
pnpm lint:fix               # ESLint com auto-fix
pnpm format                 # Prettier check
pnpm format:fix             # Prettier auto-format
pnpm type-check             # TypeScript type check

# Banco de Dados
pnpm prisma migrate dev     # Criar/aplicar migrations
pnpm prisma generate        # Gerar Prisma Client
pnpm prisma studio          # Prisma Studio (GUI)
pnpm prisma db seed         # Popular com dados de exemplo

# Testes
pnpm test                   # Executar todos os testes
pnpm test:ui                # Vitest UI
pnpm test:coverage          # Cobertura de testes

# Docker
docker-compose up -d        # Iniciar infraestrutura
docker-compose down         # Parar infraestrutura
docker-compose logs -f      # Ver logs
```

---

## 🌍 Internacionalização (i18n)

O projeto suporta 3 idiomas:

- 🇧🇷 Português (pt)
- 🇺🇸 English (en)
- 🇪🇸 Español (es)

### Como funciona

```typescript
// Middleware detecta idioma preferido do navegador
// app/[locale]/page.tsx

import { useTranslations } from 'next-intl'

export default function Page() {
  const t = useTranslations()

  return <h1>{t('dashboard.title')}</h1>
}
```

### Adicionar novas traduções

Edite `messages/{locale}.json`:

```json
{
  "dashboard": {
    "title": "Dashboard",
    "newFeature": "Nova funcionalidade"
  }
}
```

---

## 🔐 Autenticação

### Provedores Suportados

- ✉️ **Email/Password** (credenciais)
- 🔵 **Google OAuth**
- 🐙 **GitHub OAuth**

### Configuração OAuth

Veja [OAuth Setup Guide](./docs/oauth-setup-guide.md) para configurar Google e GitHub.

### Fluxo de Autenticação

```mermaid
sequenceDiagram
    User->>App: Acessa /dashboard
    App->>Better Auth: Verifica sessão
    Better Auth-->>App: Não autenticado
    App->>User: Redireciona para /auth/login
    User->>Better Auth: Login (email/OAuth)
    Better Auth->>Prisma: Cria/valida usuário
    Better Auth-->>User: Sessão criada (cookie)
    User->>App: Acessa /dashboard
    App-->>User: Dashboard renderizado
```

---

## ⚡ Performance

### Otimizações Implementadas

- ✅ **Server Components** - Renderização no servidor por padrão
- ✅ **Streaming** - Suspense boundaries para carregamento progressivo
- ✅ **Cache Tags** - Revalidação granular de dados
- ✅ **Dynamic Imports** - Code splitting de components pesados
- ✅ **Image Optimization** - Next.js Image component
- ✅ **Font Optimization** - Google Fonts com next/font

### Métricas Lighthouse

| Métrica | Score |
|---------|-------|
| Performance | 95+ |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

---

## 🐛 Troubleshooting

### Problema: Timeout no WhatsApp (Evolution API)

**Causa:** Firewall/antivírus bloqueando WebSocket

**Solução:** Veja [WhatsApp Timeout Fix](./docs/WHATSAPP_TIMEOUT_FIX.md)

### Problema: Banco de dados slow (cold start)

**Causa:** Banco Neon/Supabase em free tier

**Solução:** Primeiro request pode demorar ~2s. Considere keep-alive.

### Problema: Testes falhando

```bash
# Limpar cache e reinstalar
rm -rf node_modules .next
pnpm install
pnpm test
```

---

## 🗺️ Roadmap

### Em Desenvolvimento

- [ ] Export de relatórios (PDF, CSV)
- [ ] Categorias customizáveis por usuário
- [ ] Gráficos avançados (treemap, sankey)
- [ ] Notificações push (Progressive Web App)
- [ ] Multi-currency support

### Melhorias Técnicas

- [ ] Migrar para React Server Actions (experimental)
- [ ] Implementar Service Worker para offline-first
- [ ] Adicionar E2E tests com Playwright
- [ ] CI/CD com GitHub Actions
- [ ] Deploy automatizado (Vercel)

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](./LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Wesley Santos**

- GitHub: [@Wesley-SdS](https://github.com/Wesley-SdS)
- Email: wesleysantos.0095@gmail.com

---

<div align="center">

**Desenvolvido com 💙 e ☕ usando Next.js 15 + React 19**

[⬆ Voltar ao topo](#-orbitfinance)

</div>
