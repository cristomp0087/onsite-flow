# 🏗️ Arquitetura - OnSite Flow

## 📦 Estrutura do Monorepo

```
onsite-flow/
├── apps/
│   ├── mobile/          # React Native + Expo
│   └── web/             # Next.js 15
├── packages/
│   └── shared/          # Código compartilhado
├── supabase/
│   └── migrations/      # Database migrations
└── docs/                # Documentação
```

---

## 🔧 Stack Tecnológica

### Mobile

- **Framework:** React Native + Expo (SDK 51+)
- **Linguagem:** TypeScript
- **Database Local:** expo-sqlite
- **Geofencing:** expo-location + expo-task-manager
- **State:** Zustand
- **Estilo:** NativeWind (Tailwind para RN)

### Web

- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript
- **State:** Zustand
- **Estilo:** Tailwind CSS
- **Gráficos:** Recharts

### Backend

- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (futuro)
- **Realtime:** Supabase Realtime (futuro)

### Tooling

- **Monorepo:** Turborepo
- **Package Manager:** pnpm
- **Linting:** ESLint + Prettier
- **Type Checking:** TypeScript strict mode

---

## 📊 Fluxo de Dados

### Mobile → Supabase

```
┌─────────────────┐
│  Mobile App     │
│  (SQLite)       │
└────────┬────────┘
         │ sync.ts
         ▼
┌─────────────────┐
│   Supabase      │
│  (PostgreSQL)   │
└────────┬────────┘
         │ realtime
         ▼
┌─────────────────┐
│   Web App       │
│  (lê Supabase)  │
└─────────────────┘
```

### Offline-First

1. **Mobile salva local** (SQLite)
2. **Marca como pendente** (synced_at = NULL)
3. **Quando online**, faz upload
4. **Web sempre lê** do Supabase

---

## 🗄️ Schema do Banco

### Tabela: `locais`

```sql
id          uuid PRIMARY KEY
user_id     uuid REFERENCES auth.users
nome        text
latitude    float8
longitude   float8
raio        int4 DEFAULT 100
cor         text
ativo       bool DEFAULT true
created_at  timestamptz
updated_at  timestamptz
```

### Tabela: `registros`

```sql
id                    uuid PRIMARY KEY
user_id               uuid REFERENCES auth.users
local_id              uuid REFERENCES locais
local_nome            text
entrada               timestamptz
saida                 timestamptz
tipo                  text DEFAULT 'automatico'
editado_manualmente   bool DEFAULT false
motivo_edicao         text
hash_integridade      text
cor                   text
device_id             text
created_at            timestamptz
synced_at             timestamptz
```

---

## 🔐 Segurança

### Row Level Security (RLS)

- Usuários só veem **seus próprios dados**
- Policies por operação (SELECT, INSERT, UPDATE, DELETE)
- Service Role Key **nunca** vai pro cliente

### Validação

- TypeScript strict mode
- Validação de coordenadas
- Hash de integridade em registros

---

## 🚀 Deploy

### Mobile

- **Desenvolvimento:** Expo Go
- **Produção:** EAS Build → App Stores

### Web

- **Plataforma:** Vercel
- **CI/CD:** GitHub Actions

### Supabase

- **Ambiente:** Supabase Cloud
- **Migrations:** Versionadas no Git

---

## 📚 Próximos Passos

Veja `CHECKPOINTS.md` para ordem de implementação.
