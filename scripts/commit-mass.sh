#!/usr/bin/env bash
set -euo pipefail

commit_group() {
  local msg="$1"; shift || true
  git add "$@" 2>/dev/null || true
  if ! git diff --cached --quiet; then
    git commit -m "$msg"
  else
    echo "skip: $msg"
  fi
}

# Verifica se é repo git
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Não é um repositório Git"; exit 1; }

# 1) Tooling / configs
commit_group "build(config): base tooling e configs" \
  .gitignore .prettierignore .prettierrc oxlint.json lint-staged.config.js \
  postcss.config.mjs next.config.mjs tsconfig.json vitest.config.ts \
  package.json pnpm-lock.yaml docker-compose.yml .husky/*

# 2) Documentação
commit_group "docs: README e documentação" README.md docs/** CRUSH.md

# 3) Ambiente de exemplo
commit_group "chore(env): exemplo de variáveis" .env.example

# 4) i18n e middleware
commit_group "feat(i18n): mensagens e middleware" messages/** middleware.ts lib/i18n.ts lib/routing.ts lib/navigation.tsx

# 5) Core/lib
commit_group "feat(core): utils, auth e libs" lib/utils.ts lib/auth.ts lib/auth-client.ts lib/ai/** lib/schemas/** lib/store/**

# 6) Banco de dados e scripts
commit_group "feat(db): prisma schema, migrations e seed" prisma/** scripts/**

# 7) Estilos globais
commit_group "style(global): estilos e globals" app/globals.css styles/**

# 8) UI base
commit_group "feat(ui): componentes base" components/ui/**

# 9) Layout/branding
commit_group "feat(layout): header, footer e brand" components/layout/** components/brand/**

# 10) Autenticação
commit_group "feat(auth): páginas e componentes" components/auth/** app/[locale]/auth/**

# 11) Dashboard - gráficos e seções
commit_group "feat(dashboard): gráficos e seções" components/*chart*.tsx components/sections/** components/language-switcher.tsx

# 12) Entidades - contas
commit_group "feat(entities): contas (lista e formulários)" \
  components/accounts-list.tsx components/account-form*.tsx app/[locale]/dashboard/accounts/**

# 13) Entidades - categorias
commit_group "feat(entities): categorias (lista e formulários)" \
  components/categories-list.tsx components/category-form*.tsx app/[locale]/dashboard/categories/**

# 14) Entidades - metas
commit_group "feat(entities): metas (lista e formulários)" \
  components/goals-list.tsx components/goal-form.tsx app/[locale]/dashboard/goals/**

# 15) Entidades - transações
commit_group "feat(entities): transações (lista e formulários)" \
  components/transactions-list.tsx components/transaction-form*.tsx app/[locale]/dashboard/transactions/**

# 16) Dashboard - insights e relatórios
commit_group "feat(dashboard): insights e relatórios" \
  components/generate-insights-button.tsx components/insights-list.tsx \
  app/[locale]/dashboard/insights/** app/[locale]/dashboard/reports/**

# 17) App root/locale
commit_group "feat(app): layouts e páginas base" \
  app/layout.tsx app/page.tsx app/not-found.tsx \
  app/[locale]/layout.tsx app/[locale]/page.tsx app/[locale]/client-*.tsx \
  components/hero/** components/features/**

# 18) APIs
commit_group "feat(api): rotas REST" app/api/**

# 19) Assets estáticos
commit_group "chore(static): assets públicos" public/**

# 20) Testes
commit_group "test: testes e setup" tests/**

# 21) Hooks
commit_group "chore(hooks): hooks compartilhados" hooks/**

if [[ "${1:-}" == "--push" ]]; then
  git push -u origin "$(git branch --show-current)"
fi

