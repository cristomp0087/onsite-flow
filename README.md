# OnSite Flow

App de ponto por geofencing para trabalhadores de construção e serviços.

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- Conta no Supabase

### Setup

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar ambiente
cp .env.example .env.local
# Edite .env.local com suas chaves do Supabase

# 3. Validar setup
./validate-cp0.sh
```

### Desenvolvimento

```bash
# Rodar todos os apps
pnpm dev

# Mobile apenas
pnpm --filter mobile dev

# Web apenas
pnpm --filter web dev

# Lint + Typecheck + Format
pnpm validate
```

## 📁 Estrutura

```
onsite-flow/
├── apps/
│   ├── mobile/          # React Native + Expo
│   └── web/             # Next.js
├── packages/
│   └── shared/          # Código compartilhado
├── supabase/
│   └── migrations/      # Database migrations
└── docs/                # Documentação
```

## 📚 Documentação

- [Arquitetura](./docs/ARCHITECTURE.md)
- [Checkpoints](./docs/CHECKPOINTS.md)

## 🛠️ Stack

- **Mobile:** React Native, Expo, SQLite
- **Web:** Next.js 15, Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Monorepo:** Turborepo, pnpm

## ✅ Status dos Checkpoints

- ✅ CP0: Fundação
- ⏳ CP1: Supabase Core
- 🔜 CP2: Mobile - SQLite
- 🔜 CP3: Mobile - Geofencing
- 🔜 CP4: Mobile - Telas
- 🔜 CP5: Mobile - Sync
- 🔜 CP6: Web - Setup
- 🔜 CP7: Web - Dashboard

Veja [CHECKPOINTS.md](./docs/CHECKPOINTS.md) para detalhes.

## 📄 Licença

UNLICENSED - Uso privado apenas.

---

**OnSite Club** - Construindo o futuro do trabalho em campo.
