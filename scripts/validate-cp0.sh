#!/bin/bash

# ===========================================
# Script de Validação - Checkpoint 0
# ===========================================

echo ""
echo "🔍 Validando Checkpoint 0: Fundação"
echo "==========================================="
echo ""

ERRORS=0

# Verifica estrutura de pastas
echo "📁 Verificando estrutura de pastas..."
REQUIRED_DIRS=(
  "apps/mobile"
  "apps/web"
  "packages/shared/src"
  "supabase/migrations"
  "docs"
)

for dir in "${REQUIRED_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "   ✅ $dir"
  else
    echo "   ❌ $dir (não encontrado)"
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""

# Verifica arquivos essenciais
echo "📄 Verificando arquivos essenciais..."
REQUIRED_FILES=(
  "package.json"
  "pnpm-workspace.yaml"
  "turbo.json"
  "tsconfig.json"
  ".eslintrc.js"
  ".prettierrc"
  ".gitignore"
  "README.md"
  "packages/shared/package.json"
  "packages/shared/src/index.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file"
  else
    echo "   ❌ $file (não encontrado)"
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""

# Verifica se pnpm está instalado
echo "🔧 Verificando ferramentas..."
if command -v pnpm &> /dev/null; then
  PNPM_VERSION=$(pnpm --version)
  echo "   ✅ pnpm instalado (v$PNPM_VERSION)"
else
  echo "   ❌ pnpm não encontrado"
  echo "      Instale com: npm install -g pnpm"
  ERRORS=$((ERRORS + 1))
fi

if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo "   ✅ Node.js instalado ($NODE_VERSION)"
else
  echo "   ❌ Node.js não encontrado"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# Tenta instalar dependências
echo "📦 Instalando dependências..."
if pnpm install --frozen-lockfile 2>/dev/null || pnpm install; then
  echo "   ✅ Dependências instaladas"
else
  echo "   ⚠️  Erro ao instalar dependências (normal na primeira execução)"
fi

echo ""

# Verifica TypeScript do pacote shared
echo "🔷 Verificando TypeScript (shared)..."
cd packages/shared
if npx tsc --noEmit 2>/dev/null; then
  echo "   ✅ TypeScript OK"
else
  echo "   ⚠️  Erros de TypeScript (verifique manualmente)"
fi
cd ../..

echo ""
echo "==========================================="

if [ $ERRORS -eq 0 ]; then
  echo "✅ CHECKPOINT 0 COMPLETO!"
  echo ""
  echo "Próximos passos:"
  echo "1. Inicialize o Git: git init && git add . && git commit -m 'chore: initial setup'"
  echo "2. Crie repositório no GitHub"
  echo "3. Configure o Supabase (Checkpoint 1)"
  echo ""
else
  echo "❌ CHECKPOINT 0 INCOMPLETO ($ERRORS erros)"
  echo ""
  echo "Corrija os erros acima antes de prosseguir."
  echo ""
fi

exit $ERRORS
