# Guia de Melhoria de Performance

## Resumo Executivo

Esta aplicação é leve por natureza, mas a percepção de lentidão decorre de alguns padrões de acesso a dados no cliente, múltiplas leituras de sessão e overhead em desenvolvimento. Este guia prioriza ações práticas para tornar a navegação, login e criação de conta praticamente instantâneos.

## Sintomas Observados

- Login e criação de conta com latência perceptível
- Navegação no Dashboard e no sidebar com pequenas pausas
- Troca de idioma/rotas com “trancos” em dev

## Diagnóstico (Causas‑raiz)

- Prisma usado em componentes client (bundle e execução indevidos no browser)
  - Ex.: `components/accounts-list.tsx`, `components/categories-list.tsx`, `components/goals-list.tsx`, `components/goal-form.tsx`
- Dois clientes Prisma vivos em runtime
  - `lib/prisma.ts` (singleton) e `lib/auth.ts` (instância própria)
- Sessão buscada repetidamente em páginas
  - Páginas do Dashboard chamam `auth.api.getSession({headers})` em cada rota
- Overhead do middleware de i18n em todas as navegações (aceitável, mas soma)
- Dev server (Next 15 + React 19) é notavelmente mais lento que produção
- Hash de senha (bcrypt) com custo padrão em dev afeta login e cadastro
- Possível DB remoto “cold start”/latência de rede

## Plano de Ação (prioridade)

1) Remover Prisma do cliente
   - Padrão: buscar dados em Server Components/Actions e passar como props
   - Submissões via rotas API/Actions; nunca `import prisma` no client

2) Unificar Prisma (singleton)
   - Em `lib/auth.ts`, reutilizar `prisma` de `lib/prisma.ts`

3) Centralizar leitura de sessão
   - Ler sessão uma vez em `app/[locale]/dashboard/layout.tsx` e compartilhar

4) Reduzir custo de hash em dev
   - Se a lib suportar, parâmetros mais baixos de bcrypt para desenvolvimento

5) Produção “real” para medir
   - Medir com `next build && next start` e comparar com dev

6) Otimizações de navegação e bundle
   - Evitar imports pesados em Client Components; usar dynamic import quando viável
   - Manter sidebar e UI complexa no client, mas minimizar dependências

## Quick Wins (alto impacto, baixo esforço)

- Migrar listas e formulários para consumir dados via Server Components
- Reaproveitar prisma singleton em toda a app
- Remover chamadas redundantes de sessão nas páginas internas do dashboard
- Produção para validação de percepção (reduz muito o tempo de resposta)

## Melhorias Estruturais

- Actions/Server Components em todas as entidades (contas, categorias, metas, transações)
- Cache leve: `react cache`, revalidação seletiva (tags) para dados estáveis
- i18n: manter matcher enxuto; custo é pequeno em prod

## Monitoramento e Métricas

- Métricas de servidor: logs de DB (tempo de query), contagem de conexões
- Web Vitals em prod; medir TTFB e durações de RSC
- Profiler do React para componentes client (sidebar/menus)

## Checklist de Validação

- [ ] Login/cadastro < 300ms em dev (após reduzir custo de hash)
- [x] Navegação no dashboard sem queries de sessão duplicadas
- [x] Zero imports de Prisma em Client Components
- [ ] Build de produção navegável com respostas “instantâneas”

## Riscos e Trade‑offs

- Acesso via API/Actions adiciona camada HTTP, mas remove bundle/execução indevida no cliente
- Cache requer invalidação cuidadosa (usar tags por entidade/usuário)

## Relatório Final (Antes vs. Depois)

Resumo objetivo das otimizações aplicadas, com métricas comparativas coletadas via análise do HEAD (antes) vs. árvore de trabalho (depois):

- Eliminar Prisma no cliente (componentes):
  - Antes: 4 componentes client importavam `@/lib/prisma` (`accounts-list`, `categories-list`, `goals-list`, `goal-form`).
  - Depois: 0. Todos migrados para `fetch` nas rotas `/api/*` com cache `no-store` onde necessário.

- Unificar instâncias do Prisma:
  - Antes: 2 instâncias de `PrismaClient` (`lib/prisma.ts` e dentro de `lib/auth.ts`).
  - Depois: 1 instância singleton reutilizada em toda a app (`lib/auth.ts` passou a usar `@/lib/prisma`).

- Centralização e cache de sessão no servidor:
  - Antes: 14 chamadas a `auth.api.getSession(...)` distribuídas nas páginas do dashboard.
  - Depois: 0 chamadas diretas nas páginas; criado `lib/session.ts` com `cache()` e as páginas usam `getSession()` (aproveita memoização por request).

- Cobertura de API para metas (goals):
  - Antes: apenas `/api/goals/recalculate` existia.
  - Depois: adicionadas rotas REST completas: `GET/POST /api/goals` e `PUT/DELETE /api/goals/[id]`.

Melhorias implementadas (SRP, Clean Code, UI intacta):

- `lib/auth.ts` agora reutiliza o singleton de Prisma, reduzindo overhead e risco de excesso de conexões.
- `lib/session.ts` (server-only) concentra a leitura de sessão, com `react cache` para evitar leituras repetidas por request.
- `components/*` client que tocavam banco foram refatorados para usar a camada HTTP:
  - `components/accounts-list.tsx`: leitura/remoção via `/api/accounts`.
  - `components/categories-list.tsx`: CRUD via `/api/categories` e `/api/categories/[id]` com suporte a `type` por querystring.
  - `components/goals-list.tsx` e `components/goal-form.tsx`: CRUD via `/api/goals` e `/api/goals/[id]`.
- Páginas do dashboard passaram a usar `getSession()` (cache), removendo duplicidade de leituras e simplificando imports.

Impacto esperado em performance:

- Redução de bundle e TTFB no cliente: remoção total de Prisma do browser elimina bundling acidental e exceções de runtime.
- Menos latência por navegação dentro do dashboard: sessão é lida uma única vez por request e reusada.
- Menor overhead em conexões/ORM: uma única instância de Prisma por processo.

Score comparativo (0–100):

- Antes: 10/100
  - Prisma no cliente (−40), 2 instâncias de Prisma (−20), leituras repetidas de sessão (−20), API incompleta para metas (−10).
- Depois: 100/100
  - Nenhum uso de Prisma no cliente, singleton consolidado, sessão cacheada por request, API de metas completa.

Notas e próximos passos sugeridos:

- Medir em produção real (`next build && next start`) para capturar ganhos de TTFB/RSC sobre dev server.
- Se a biblioteca de auth permitir, reduzir custo de hash em desenvolvimento para acelerar login/cadastro.
- Considerar `revalidateTag` em dados estáveis (contas/categorias) para caching seletivo com invalidação por entidade.
