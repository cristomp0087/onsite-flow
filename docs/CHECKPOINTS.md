# ✅ Checkpoints - OnSite Flow

**Filosofia:** Cada checkpoint deve rodar 100% sem erros antes de avançar.

---

## ✅ CP0: Fundação

**Status:** ✅ COMPLETO  
**Objetivo:** Setup monorepo + tooling  
**Validação:** `./validate-cp0.sh`

### O que foi feito:

- ✅ Monorepo com pnpm + Turborepo
- ✅ TypeScript configurado
- ✅ ESLint + Prettier funcionando
- ✅ packages/shared estruturado
- ✅ .env.example documentado
- ✅ .gitignore completo
- ✅ Documentação inicial

### Comandos de teste:

```bash
pnpm install
pnpm typecheck    # TypeScript OK
pnpm lint         # ESLint OK
pnpm format:check # Prettier OK
```

---

## ⏳ CP1: Supabase Core

**Status:** 🔄 PRÓXIMO  
**Objetivo:** Database + Auth + RLS  
**Tempo:** 45min

### O que vai fazer:

- [ ] Criar projeto no Supabase
- [ ] Migration: criar tabelas `locais` e `registros`
- [ ] Configurar RLS policies
- [ ] Adicionar índices de performance
- [ ] Adicionar triggers (updated_at)
- [ ] Testar auth + queries

### Validação:

```bash
supabase db reset
supabase db test
```

---

## ⏳ CP2: Mobile - SQLite Local

**Status:** 🔜 AGUARDANDO  
**Objetivo:** Database local + stores básicos  
**Tempo:** 1h

### O que vai fazer:

- [ ] Setup Expo project
- [ ] Configurar expo-sqlite
- [ ] Criar database.ts (schema + queries)
- [ ] Criar authStore (Zustand + Supabase Auth)
- [ ] Criar locationStore (permissões + GPS)
- [ ] Tela de Login básica

### Validação:

```bash
npx expo start
# App abre, permite login, salva dados localmente
```

---

## ⏳ CP3: Mobile - Geofencing

**Status:** 🔜 AGUARDANDO  
**Objetivo:** Detectar entrada/saída de áreas  
**Tempo:** 1.5h

### O que vai fazer:

- [ ] Configurar expo-task-manager
- [ ] Criar geofencingService
- [ ] Definir regiões monitoradas
- [ ] Handler de entrada/saída
- [ ] Salvar eventos no SQLite
- [ ] Background task funcionando

### Validação:

```bash
# Testar entrada/saída de área
# Verificar se registros são salvos
```

---

## ⏳ CP4: Mobile - Telas Core

**Status:** 🔜 AGUARDANDO  
**Objetivo:** UI completa  
**Tempo:** 1h

### O que vai fazer:

- [ ] Tela: Mapa com locais
- [ ] Tela: Lista de sessões
- [ ] Tela: Adicionar local
- [ ] Tela: Detalhes de sessão
- [ ] Navegação completa

### Validação:

```bash
# Navegar por todas as telas
# Adicionar local
# Ver sessões
```

---

## ⏳ CP5: Mobile - Sync Básico

**Status:** 🔜 AGUARDANDO  
**Objetivo:** Upload/download Supabase  
**Tempo:** 1h

### O que vai fazer:

- [ ] Implementar sync.ts
- [ ] Implementar syncStore
- [ ] Upload de registros pendentes
- [ ] Download de dados remotos
- [ ] Resolver conflitos (mais recente ganha)
- [ ] Auto-sync quando online

### Validação:

```bash
# Adicionar dados offline
# Conectar wifi
# Ver dados no Supabase
```

---

## ⏳ CP6: Web - Setup + Auth

**Status:** 🔜 AGUARDANDO  
**Objetivo:** Next.js + Login  
**Tempo:** 1h

### O que vai fazer:

- [ ] Setup Next.js 15 + App Router
- [ ] Configurar Supabase SSR
- [ ] Middleware de auth
- [ ] Páginas: Login, Signup, Dashboard
- [ ] Layout principal

### Validação:

```bash
pnpm dev
# Acessar localhost:3000
# Fazer login
# Ver dashboard vazio
```

---

## ⏳ CP7: Web - Dashboard

**Status:** 🔜 AGUARDANDO  
**Objetivo:** Visualizar dados  
**Tempo:** 1.5h

### O que vai fazer:

- [ ] Implementar sessoesStore
- [ ] Buscar registros do Supabase
- [ ] Tabela de sessões
- [ ] Gráfico de horas por dia
- [ ] Totalizadores
- [ ] Filtros por data

### Validação:

```bash
# Ver sessões do mobile
# Gráficos renderizando
# Filtros funcionando
```

---

## 🎯 Roadmap Futuro

### CP8: Edição Manual (opcional)

- Editar entrada/saída manualmente
- Adicionar motivo de edição
- Preservar hash de integridade

### CP9: Relatórios (opcional)

- Exportar CSV
- Gráficos avançados
- Comparações

### CP10: Deploy (final)

- CI/CD no GitHub Actions
- Deploy web na Vercel
- Build mobile com EAS

---

## 📝 Notas

### Como usar este documento:

1. Não pule checkpoints
2. Valide TUDO antes de avançar
3. Commit após cada checkpoint completo
4. Se algo quebrar, volte ao último checkpoint válido

### Se algo falhar:

```bash
# Reverter para último checkpoint
git log --oneline --grep="CP[0-9]"
git reset --hard <commit-do-checkpoint>
```
