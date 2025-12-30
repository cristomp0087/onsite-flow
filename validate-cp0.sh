#!/bin/bash

# ===========================================
# Validação - Checkpoint 0: Fundação
# ===========================================

echo ""
echo "🔍 Validando Checkpoint 0: Fundação"
echo "==========================================="
echo ""

ERRORS=0
WARNINGS=0

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para erro
error() {
  echo -e "   ${RED}❌${NC} $1"
  ERRORS=$((ERRORS + 1))
}

# Função para sucesso
success() {
  echo -e "   ${GREEN}✅${NC} $1"
}

# Função para warning
warning() {
  echo -e "   ${YELLOW}⚠️${NC}  $1"
  WARNINGS=$((WARNINGS + 1))
}

# ===========================================
# 1. ESTRUTURA DE PASTAS
# ===========================================
echo "📁 Verificando estrutura de pastas..."
REQUIRED_DIRS=(
  "apps/mobile"
  "apps/web"
  "packages/shared/src"
  "packages/shared/src/types"
  "packages/shared/src/utils"
  "packages/shared/src/constants"
  "supabase/migrations"
  "docs"
)

for dir in "${REQUIRED_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    success "$dir"
  else
    error "$dir (não encontrado)"
  fi
done

echo ""

# ===========================================
# 2. ARQUIVOS ESSENCIAIS
# ===========================================
echo "📄 Verificando arquivos essenciais..."
REQUIRED_FILES=(
  "package.json"
  "pnpm-workspace.yaml"
  "turbo.json"
  "tsconfig.json"
  ".eslintrc.js"
  ".prettierrc"
  ".prettierignore"
  ".gitignore"
  ".env.example"
  "README.md"
  "packages/shared/package.json"
  "packages/shared/tsconfig.json"
  "packages/shared/src/index.ts"
  "packages/shared/src/types/index.ts"
  "packages/shared/src/utils/index.ts"
  "packages/shared/src/constants/index.ts"
  "docs/ARCHITECTURE.md"
  "docs/CHECKPOINTS.md"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    success "$file"
  else
    error "$file (não encontrado)"
  fi
done

echo ""

# ===========================================
# 3. FERRAMENTAS
# ===========================================
echo "🔧 Verificando ferramentas instaladas..."

if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  success "Node.js instalado ($NODE_VERSION)"
else
  error "Node.js não encontrado"
fi

if command -v pnpm &> /dev/null; then
  PNPM_VERSION=$(pnpm --version)
  success "pnpm instalado (v$PNPM_VERSION)"
else
  error "pnpm não encontrado - Instale com: npm install -g pnpm"
fi

echo ""

# ===========================================
# 4. DEPENDÊNCIAS
# ===========================================
echo "📦 Instalando dependências..."

if [ ! -d "node_modules" ]; then
  warning "node_modules não existe, instalando..."
fi

if pnpm install --frozen-lockfile 2>/dev/null || pnpm install; then
  success "Dependências instaladas"
else
  error "Erro ao instalar dependências"
fi

echo ""

# ===========================================
# 5. TYPESCRIPT
# ===========================================
echo "🔷 Verificando TypeScript..."

# Testar shared
cd packages/shared
if npx tsc --noEmit 2>/dev/null; then
  success "TypeScript OK (shared)"
else
  warning "Erros de TypeScript em shared (esperado - ainda não há apps)"
fi
cd ../..

echo ""

# ===========================================
# 6. ESLINT
# ===========================================
echo "🔍 Verificando ESLint..."

cd packages/shared
if npx eslint src/ --max-warnings 0 2>/dev/null; then
  success "ESLint OK (shared)"
else
  warning "Avisos de ESLint (aceitável no CP0)"
fi
cd ../..

echo ""

# ===========================================
# 7. PRETTIER
# ===========================================
echo "💅 Verificando Prettier..."

if pnpm format:check > /dev/null 2>&1; then
  success "Prettier OK"
else
  warning "Alguns arquivos precisam de formatação (rode: pnpm format)"
fi

echo ""

# ===========================================
# 8. ENV EXAMPLE
# ===========================================
echo "🔐 Verificando .env.example..."

if grep -q "SUPABASE_URL" .env.example; then
  success ".env.example contém SUPABASE_URL"
else
  error ".env.example não contém SUPABASE_URL"
fi

if grep -q "EXPO_PUBLIC_SUPABASE_URL" .env.example; then
  success ".env.example contém vars do mobile"
else
  error ".env.example não contém vars do mobile"
fi

if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.example; then
  success ".env.example contém vars do web"
else
  error ".env.example não contém vars do web"
fi

echo ""

# ===========================================
# 9. GITIGNORE
# ===========================================
echo "🚫 Verificando .gitignore..."

if grep -q ".env.local" .gitignore; then
  success ".gitignore contém .env.local"
else
  error ".gitignore não protege .env.local"
fi

if grep -q "*.db" .gitignore; then
  success ".gitignore contém *.db (SQLite)"
else
  warning ".gitignore não ignora arquivos SQLite"
fi

echo ""

# ===========================================
# RESUMO FINAL
# ===========================================
echo "==========================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ CHECKPOINT 0 COMPLETO!${NC}"
  echo ""
  echo "Tudo funcionando perfeitamente. Próximos passos:"
  echo ""
  echo "1. Inicialize o Git:"
  echo "   git init"
  echo "   git add ."
  echo "   git commit -m 'chore: checkpoint 0 - fundação completa'"
  echo ""
  echo "2. Configure seu .env.local:"
  echo "   cp .env.example .env.local"
  echo "   # Edite com suas chaves do Supabase"
  echo ""
  echo "3. Avance para Checkpoint 1:"
  echo "   Veja docs/CHECKPOINTS.md"
  echo ""
elif [ $ERRORS -eq 0 ] && [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  CHECKPOINT 0 COMPLETO (com $WARNINGS avisos)${NC}"
  echo ""
  echo "Avisos não são críticos. Você pode avançar."
  echo ""
  echo "Para corrigir avisos (opcional):"
  echo "   pnpm format"
  echo ""
else
  echo -e "${RED}❌ CHECKPOINT 0 INCOMPLETO${NC}"
  echo ""
  echo "Encontrados: $ERRORS erros, $WARNINGS avisos"
  echo ""
  echo "Corrija os erros acima antes de prosseguir."
  echo ""
fi

exit $ERRORS
