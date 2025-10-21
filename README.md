# OrbitFinance

Plataforma de finanças pessoais com IA em Next.js 15 (App Router), React 19, next-intl e Prisma/PostgreSQL. Inclui autenticação com Better Auth, UI acessível e dashboard traduzido (pt, en, es).

## Visão Geral
- App Router com segmentação por locale: 
- i18n com  (mensagens em )
- Autenticação com Better Auth e Prisma
- Dashboard com charts e sidebar recolhível
- Padrões: Clean Code, SOLID, SRP

## Tecnologias
- Next.js 15, React 19
- next-intl (i18n e middleware)
- Prisma ORM + PostgreSQL
- Tailwind CSS 4
- Better Auth
- Recharts

## Estrutura de Pastas
- : páginas por idioma (layout, dashboard, auth)
- : UI e componentes (listas, formulários, charts)
- : utilitários (auth, prisma, i18n, routing)
- : traduções (pt, en, es)
- : schema e seeds
- : assets

## Setup
1. Ambiente ():
   - 
2. Instalar deps: 
3. Banco:
   - 
   - 
   -  (opcional)

## Scripts
- : desenvolvimento
-  / : produção
- : TypeScript
- : testes
- : infraestrutura local

## i18n
- Middleware: 
- Request config: 
- Navegação: , 
- Mensagens: 

## Autenticação
- Better Auth com Prisma Adapter ()
- Sessão lida no layout do dashboard

## Padrões de Código
- Clean Code, SOLID, SRP
- Sem comentários poluentes

## Performance
- Evitar Prisma no cliente; preferir Server Components/Ações
- Centralizar leitura de sessão no layout
- Produção: 

## Troubleshooting
- Banco remoto pode sofrer cold start
- Ajuste custo de hash do auth em dev caso login esteja lento

## Roadmap
- Remover Prisma de componentes client
- Unificar  (singleton)
- Cache leve em leituras estáveis

## Scripts úteis

- Lint:  / 
- Formatação:  / 
- Docker logs: 

## Autenticação
- Better Auth com Prisma Adapter (lib/auth.ts)
- Sessão lida no layout do dashboard

## Padrões de Código
- Clean Code, SOLID, SRP
- Sem comentários poluentes
