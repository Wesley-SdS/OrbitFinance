#!/bin/bash

# Script para commits granulares inteligentes
# Organiza as mudanças em blocos lógicos baseados no tipo e funcionalidade

set -e

echo "🔍 Analisando arquivos modificados..."
FILES=$(git status --porcelain | grep -E "^[ AM\?]" | cut -c4-)

if [ -z "$FILES" ]; then
    echo "❌ Nenhum arquivo modificado encontrado para commit."
    exit 1
fi

echo "📁 Arquivos encontrados:"
echo "$FILES"
echo ""

# Função para fazer commit de um grupo específico
commit_group() {
    local pattern="$1"
    local message="$2"
    local files
    
    files=$(echo "$FILES" | grep -E "$pattern" || true)
    
    if [ -n "$files" ]; then
        echo "🔄 Fazendo commit: $message"
        echo "📄 Arquivos:"
        echo "$files"
        echo ""
        
        git add $files
        git commit -m "$message"
        echo "✅ Commit realizado com sucesso!"
        echo "---"
    fi
}

# 1. Schema do Banco de Dados
commit_group \
    "prisma/schema\.prisma" \
    "feat: update database schema"

# 2. Configurações e Infraestrutura
commit_group \
    "(middleware\.ts|lib/(prisma|session|cached)\.ts|next\.config\.mjs)" \
    "feat: update infrastructure and configuration"

# 3. API Routes - Core entities
commit_group \
    "app/api/(accounts|categories|goals|transactions)/.*\.ts" \
    "feat: update core API routes"

# 4. API Routes - Features específicas
commit_group \
    "app/api/(insights|export|whatsapp|cron|events|jobs|reminders|tasks)/.*\.ts" \
    "feat: implement feature-specific API routes"

# 5. Components - Listas e Forms
commit_group \
    "components/(.*-list\.tsx|.*-form\.tsx|.*-loader\.tsx)" \
    "feat: update list and form components"

# 6. Components - Dashboard e Navegação
commit_group \
    "components/(dashboard-nav|brand/logo)\.tsx" \
    "feat: update navigation and branding components"

# 7. Pages - Dashboard
commit_group \
    "app/\[locale\]/dashboard/.*\.tsx" \
    "feat: update dashboard pages"

# 8. Pages - Auth e Gerais
commit_group \
    "app/\[locale\]/(auth|.*)/.*\.tsx" \
    "feat: update authentication and general pages"

# 9. Bibliotecas e Utilitários
commit_group \
    "lib/(assistant|queries|types)/.*" \
    "feat: implement libraries and utilities"

# 10. Componentes UI
commit_group \
    "components/ui/.*\.tsx" \
    "feat: update UI components"

# 11. Testes
commit_group \
    "tests/.*\.(test|spec)\.(ts|tsx|js|jsx)" \
    "test: add and update test cases"

# 12. Documentação
commit_group \
    "docs/.*\.md" \
    "docs: update documentation"

# 13. Configurações de Desenvolvimento
commit_group \
    "(\.vscode/.*|\.husky/.*|.*\.config\.(js|ts|json)|lint-staged\.config\.js)" \
    "chore: update development configuration"

# 14. Scripts
commit_group \
    "scripts/.*\.(sh|js)" \
    "chore: update scripts"

# 15. Arquivos restantes (novos arquivos não categorizados)
commit_group \
    "(\.vscode/)" \
    "chore: update development environment configuration"

echo ""
echo "🎉 Processo de commits concluído!"
echo "📊 Resumo:"
git log --oneline -10

echo ""
echo "🔍 Verificando se restou algum arquivo..."
REMAINING=$(git status --porcelain | grep -E "^[ AM]" | cut -c4- || true)

if [ -n "$REMAINING" ]; then
    echo "⚠️  Arquivos restantes sem commit:"
    echo "$REMAINING"
    echo ""
    echo "💡 Sugestão: revise manualmente os arquivos acima"
else
    echo "✅ Todos os arquivos foram commitados!"
fi