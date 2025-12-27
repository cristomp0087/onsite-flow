# OnSite Flow — Documento de Arquitetura

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Status:** Aprovado para Desenvolvimento  

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Princípios Arquiteturais](#2-princípios-arquiteturais)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Arquitetura do Sistema](#4-arquitetura-do-sistema)
5. [Modelo de Dados](#5-modelo-de-dados)
6. [Fluxos Principais](#6-fluxos-principais)
7. [Segurança e Privacidade](#7-segurança-e-privacidade)
8. [Infraestrutura e Deploy](#8-infraestrutura-e-deploy)
9. [Monitoramento e Analytics](#9-monitoramento-e-analytics)
10. [Cronograma de Desenvolvimento](#10-cronograma-de-desenvolvimento)
11. [Riscos e Mitigações](#11-riscos-e-mitigações)
12. [Glossário](#12-glossário)

---

## 1. Visão Geral

### 1.1 O Problema

Trabalhadores autônomos e freelancers precisam registrar suas horas de trabalho de forma confiável, sem depender de sistemas corporativos complexos ou supervisão de terceiros. Atualmente, a maioria usa planilhas manuais ou aplicativos que exigem ação constante do usuário.

### 1.2 A Solução

**OnSite Flow** é um aplicativo mobile que automatiza o registro de ponto através de geofencing. O usuário define locais de trabalho no mapa, e o app detecta automaticamente quando ele entra ou sai dessas áreas, registrando as horas trabalhadas.

### 1.3 Proposta de Valor

- **Automação:** Detecção automática de entrada/saída via GPS
- **Independência:** Usuário controla seus próprios dados
- **Simplicidade:** Interface mínima, funciona em background
- **Confiabilidade:** Relatórios com verificação de integridade
- **Offline-First:** Funciona sem internet, sincroniza depois

### 1.4 Público-Alvo (v1)

- Trabalhadores da construção civil
- Prestadores de serviço que visitam clientes
- Freelancers com múltiplos locais de trabalho
- Autônomos que precisam comprovar horas para clientes

### 1.5 Escopo da v1 (Beta)

**Incluído:**
- App mobile (Android + iOS)
- Geofencing com raio configurável
- Registro automático de entrada/saída
- Histórico e relatórios básicos
- Gráficos de horas por local
- Exportação de relatórios (compartilhável)
- Dashboard web para gerenciamento

**Não incluído (v2+):**
- Grupos/equipes
- Integração com folha de pagamento
- Reconhecimento facial
- Múltiplos idiomas

---

## 2. Princípios Arquiteturais

### 2.1 Offline-First

O app deve funcionar 100% sem internet. Dados são armazenados localmente e sincronizados quando há conexão.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Ação do       │────▶│   SQLite        │────▶│   Supabase      │
│   Usuário       │     │   (Local)       │     │   (Cloud)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        Funciona sem
                        internet ✓
```

### 2.2 Privacy by Design

- Dados de localização são processados no dispositivo
- Apenas coordenadas dos locais cadastrados vão para a nuvem
- Tracking contínuo de GPS NÃO é armazenado
- Usuário pode exportar e deletar todos os seus dados

### 2.3 Battery-Conscious

- GPS usa modo de baixa energia quando possível
- Geofencing nativo do OS (não polling constante)
- Sincronização em batch (não a cada evento)

### 2.4 Fail-Safe

- Se a notificação não for respondida, ação padrão em 30 segundos
- Se a bateria acabar, registro é fechado com timestamp estimado
- Se o app crashar, estado é recuperado do SQLite

---

## 3. Stack Tecnológico

### 3.1 Mobile App

| Camada | Tecnologia | Versão | Justificativa |
|--------|------------|--------|---------------|
| Framework | React Native | 0.73+ | Multiplataforma, ecossistema JS |
| Plataforma | Expo (Managed) | SDK 50+ | Simplifica builds e atualizações |
| Linguagem | TypeScript | 5.0+ | Type-safety, menos bugs |
| GPS Background | @transistorsoft/react-native-background-geolocation | 4.x | Única lib confiável para background |
| Banco Local | expo-sqlite | 14.x | SQLite nativo, simples |
| Estado | Zustand | 4.x | Leve, sem boilerplate |
| UI Components | React Native Paper | 5.x | Material Design, acessível |
| Mapas | react-native-maps | 1.x | Google Maps / Apple Maps nativo |
| Gráficos | react-native-chart-kit | 6.x | Simples, leve |
| Notificações | expo-notifications | 0.27+ | Push local e remoto |

### 3.2 Backend

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| BaaS | Supabase | PostgreSQL + Auth + Realtime + Storage |
| Banco | PostgreSQL 15 | Robusto, extensível, grátis no tier inicial |
| Auth | Supabase Auth | Email/senha, social login futuro |
| Functions | Supabase Edge Functions | Deno runtime, para relatórios |
| Storage | Supabase Storage | Para exports de relatórios (opcional) |

### 3.3 Web Admin

| Camada | Tecnologia | Versão | Justificativa |
|--------|------------|--------|---------------|
| Framework | Next.js | 14+ | App Router, RSC, performance |
| Linguagem | TypeScript | 5.0+ | Consistência com mobile |
| Styling | Tailwind CSS | 3.x | Rápido, utility-first |
| UI Components | shadcn/ui | latest | Componentes acessíveis, customizáveis |
| Mapas | Leaflet + react-leaflet | 4.x | Gratuito, sem API key |
| Gráficos | Recharts | 2.x | React-first, declarativo |
| Forms | React Hook Form + Zod | - | Validação type-safe |

### 3.4 Infraestrutura

| Serviço | Provedor | Tier | Custo Estimado |
|---------|----------|------|----------------|
| Backend | Supabase | Free → Pro | $0 → $25/mês |
| Web Hosting | Vercel | Hobby → Pro | $0 → $20/mês |
| Mobile Builds | EAS (Expo) | Free → Production | $0 → $99/mês |
| Domínio | Cloudflare | - | ~$10/ano |
| **Total Beta** | - | - | **$0 - $50/mês** |

### 3.5 Ferramentas de Desenvolvimento

| Ferramenta | Uso |
|------------|-----|
| pnpm | Package manager (monorepo) |
| Turborepo | Build system para monorepo |
| ESLint + Prettier | Linting e formatação |
| Husky | Git hooks (pre-commit) |
| GitHub Actions | CI/CD |
| Sentry | Error tracking (mobile + web) |

---

## 4. Arquitetura do Sistema

### 4.1 Diagrama Geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            📱 MOBILE APP                                    │
│                         (React Native + Expo)                               │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    Screens   │  │   Services   │  │   Database   │  │    Stores    │    │
│  │              │  │              │  │              │  │              │    │
│  │ • Home       │  │ • GPS        │  │ • SQLite     │  │ • AuthStore  │    │
│  │ • Map        │  │ • Geofence   │  │              │  │ • AppStore   │    │
│  │ • History    │  │ • Sync       │  │ Tabelas:     │  │ • GeoStore   │    │
│  │ • Settings   │  │ • Notify     │  │ • registros  │  │              │    │
│  │ • Reports    │  │ • Reports    │  │ • locais     │  │              │    │
│  │              │  │              │  │ • sync_queue │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│         │                 │                 │                 │             │
│         └─────────────────┼─────────────────┼─────────────────┘             │
│                           │                 │                               │
│                           ▼                 ▼                               │
│                    ┌─────────────────────────────┐                          │
│                    │      Sync Engine            │                          │
│                    │  (Background + Foreground)  │                          │
│                    └─────────────────────────────┘                          │
│                                   │                                         │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                                    │ HTTPS (REST + Realtime)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            ☁️ SUPABASE                                      │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Auth       │  │  PostgreSQL  │  │   Storage    │  │   Edge Fn    │    │
│  │              │  │              │  │              │  │              │    │
│  │ • JWT        │  │ • profiles   │  │ • Relatórios │  │ • Gerar PDF  │    │
│  │ • Sessions   │  │ • locais     │  │   exportados │  │ • Cálculos   │    │
│  │ • Email      │  │ • registros  │  │              │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                           │                                                 │
└───────────────────────────┼─────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                          🖥️ WEB ADMIN                                       │
│                          (Next.js)                                          │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Pages      │  │  Components  │  │    Hooks     │  │     Lib      │    │
│  │              │  │              │  │              │  │              │    │
│  │ • /dashboard │  │ • Map        │  │ • useAuth    │  │ • supabase   │    │
│  │ • /locais    │  │ • Charts     │  │ • useLocais  │  │ • utils      │    │
│  │ • /history   │  │ • Tables     │  │ • useRecords │  │ • validators │    │
│  │ • /settings  │  │ • Forms      │  │              │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Estrutura do Monorepo

```
onsite-flow/
│
├── apps/
│   │
│   ├── mobile/                      # React Native + Expo
│   │   ├── app/                     # Expo Router (file-based routing)
│   │   │   ├── (auth)/              # Rotas de autenticação
│   │   │   │   ├── login.tsx
│   │   │   │   └── register.tsx
│   │   │   ├── (tabs)/              # Rotas principais (tab bar)
│   │   │   │   ├── index.tsx        # Home/Dashboard
│   │   │   │   ├── map.tsx          # Mapa de locais
│   │   │   │   ├── history.tsx      # Histórico
│   │   │   │   └── settings.tsx     # Configurações
│   │   │   ├── report/[id].tsx      # Detalhe de relatório
│   │   │   └── _layout.tsx          # Layout raiz
│   │   │
│   │   ├── src/
│   │   │   ├── components/          # Componentes reutilizáveis
│   │   │   │   ├── ui/              # Botões, inputs, cards
│   │   │   │   ├── maps/            # MapView, markers
│   │   │   │   └── charts/          # Gráficos
│   │   │   │
│   │   │   ├── services/            # Lógica de negócio
│   │   │   │   ├── gps.ts           # GPS e permissões
│   │   │   │   ├── geofence.ts      # Lógica de cercas virtuais
│   │   │   │   ├── notifications.ts # Push local
│   │   │   │   ├── sync.ts          # Sincronização com Supabase
│   │   │   │   └── reports.ts       # Geração de relatórios
│   │   │   │
│   │   │   ├── database/            # SQLite local
│   │   │   │   ├── schema.ts        # Definição das tabelas
│   │   │   │   ├── migrations.ts    # Migrações
│   │   │   │   ├── queries.ts       # Queries tipadas
│   │   │   │   └── index.ts         # Inicialização
│   │   │   │
│   │   │   ├── stores/              # Estado global (Zustand)
│   │   │   │   ├── authStore.ts
│   │   │   │   ├── appStore.ts
│   │   │   │   └── geoStore.ts
│   │   │   │
│   │   │   ├── hooks/               # React hooks customizados
│   │   │   │   ├── useLocation.ts
│   │   │   │   ├── useGeofence.ts
│   │   │   │   └── useRecords.ts
│   │   │   │
│   │   │   ├── utils/               # Helpers
│   │   │   │   ├── date.ts
│   │   │   │   ├── hash.ts
│   │   │   │   └── format.ts
│   │   │   │
│   │   │   └── constants/           # Constantes
│   │   │       ├── colors.ts
│   │   │       └── config.ts
│   │   │
│   │   ├── assets/                  # Imagens, fontes
│   │   ├── app.json                 # Config Expo
│   │   ├── eas.json                 # Config EAS Build
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── web/                         # Next.js Admin
│       ├── src/
│       │   ├── app/                 # App Router
│       │   │   ├── (auth)/
│       │   │   │   ├── login/page.tsx
│       │   │   │   └── layout.tsx
│       │   │   ├── (dashboard)/
│       │   │   │   ├── page.tsx           # Dashboard principal
│       │   │   │   ├── locais/page.tsx    # Gerenciar locais
│       │   │   │   ├── historico/page.tsx # Histórico
│       │   │   │   ├── relatorios/page.tsx
│       │   │   │   └── layout.tsx
│       │   │   ├── layout.tsx
│       │   │   └── globals.css
│       │   │
│       │   ├── components/
│       │   │   ├── ui/              # shadcn/ui components
│       │   │   ├── maps/
│       │   │   ├── charts/
│       │   │   └── tables/
│       │   │
│       │   └── lib/
│       │       ├── supabase/
│       │       │   ├── client.ts    # Browser client
│       │       │   ├── server.ts    # Server client
│       │       │   └── middleware.ts
│       │       └── utils.ts
│       │
│       ├── public/
│       ├── next.config.js
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                      # Código compartilhado
│       ├── src/
│       │   ├── types/               # TypeScript types
│       │   │   ├── database.ts      # Tipos do Supabase
│       │   │   ├── models.ts        # Modelos de domínio
│       │   │   └── api.ts           # Request/Response types
│       │   │
│       │   ├── constants/
│       │   │   ├── colors.ts        # Paleta de cores
│       │   │   ├── geofence.ts      # Configs de geofence
│       │   │   └── time.ts          # Horários padrão
│       │   │
│       │   ├── validators/          # Zod schemas
│       │   │   ├── local.ts
│       │   │   ├── registro.ts
│       │   │   └── profile.ts
│       │   │
│       │   └── utils/
│       │       ├── hash.ts          # SHA256 para integridade
│       │       ├── date.ts          # Formatação de datas
│       │       └── geo.ts           # Cálculos geográficos
│       │
│       ├── tsconfig.json
│       └── package.json
│
├── supabase/
│   ├── migrations/                  # SQL migrations
│   │   ├── 00001_initial_schema.sql
│   │   └── 00002_add_indexes.sql
│   │
│   ├── functions/                   # Edge Functions
│   │   └── generate-report/
│   │       └── index.ts
│   │
│   ├── seed.sql                     # Dados de teste
│   └── config.toml                  # Config local
│
├── docs/
│   ├── ARCHITECTURE.md              # Este documento
│   ├── DATABASE.md                  # Detalhes do banco
│   ├── API.md                       # Endpoints
│   ├── SETUP.md                     # Guia de instalação
│   └── CONTRIBUTING.md              # Guia para contribuidores
│
├── .github/
│   └── workflows/
│       ├── ci.yml                   # Testes e lint
│       ├── deploy-web.yml           # Deploy Vercel
│       └── build-mobile.yml         # EAS Build
│
├── turbo.json                       # Turborepo config
├── pnpm-workspace.yaml              # pnpm workspaces
├── package.json                     # Root package.json
├── .eslintrc.js
├── .prettierrc
└── README.md
```

---

## 5. Modelo de Dados

### 5.1 Diagrama ER

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    profiles     │       │     locais      │       │    registros    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK, UUID)   │──┐    │ id (PK, UUID)   │──┐    │ id (PK, UUID)   │
│ nome            │  │    │ user_id (FK)    │◀─┼────│ user_id (FK)    │
│ email           │  │    │ nome            │  │    │ local_id (FK)   │◀─┐
│ cor_padrao      │  │    │ latitude        │  │    │ local_nome      │  │
│ horario_inicio  │  │    │ longitude       │  │    │ entrada         │  │
│ horario_fim     │  │    │ raio            │  │    │ saida           │  │
│ created_at      │  │    │ cor             │  │    │ tipo            │  │
└─────────────────┘  │    │ ativo           │  │    │ editado_manual  │  │
                     │    │ created_at      │  │    │ hash_integridade│  │
                     │    └─────────────────┘  │    │ cor             │  │
                     │           │             │    │ created_at      │  │
                     │           │             │    │ synced_at       │  │
                     │           │             │    └─────────────────┘  │
                     │           │             │             │           │
                     └───────────┴─────────────┴─────────────┴───────────┘
                                        1:N relationships
```

### 5.2 Schema SQL Completo

```sql
-- ============================================
-- ONSITE FLOW - DATABASE SCHEMA
-- Version: 1.0
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: profiles
-- Extensão do auth.users do Supabase
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    cor_padrao TEXT DEFAULT '#3B82F6',
    horario_inicio TIME DEFAULT '05:00:00',
    horario_fim TIME DEFAULT '22:00:00',
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para criar profile automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nome, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TABELA: locais
-- Locais de trabalho com geofence
-- ============================================
CREATE TABLE public.locais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    raio INTEGER DEFAULT 50 CHECK (raio >= 10 AND raio <= 2000),
    cor TEXT DEFAULT '#3B82F6',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT locais_coords_valid CHECK (
        latitude >= -90 AND latitude <= 90 AND
        longitude >= -180 AND longitude <= 180
    )
);

-- Índices
CREATE INDEX idx_locais_user_id ON public.locais(user_id);
CREATE INDEX idx_locais_ativo ON public.locais(user_id, ativo) WHERE ativo = TRUE;

-- ============================================
-- TABELA: registros
-- Registros de ponto (entrada/saída)
-- ============================================
CREATE TABLE public.registros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    local_id UUID REFERENCES public.locais(id) ON DELETE SET NULL,
    local_nome TEXT NOT NULL,
    entrada TIMESTAMPTZ NOT NULL,
    saida TIMESTAMPTZ,
    tipo TEXT DEFAULT 'trabalho' CHECK (tipo IN ('trabalho', 'visita')),
    editado_manualmente BOOLEAN DEFAULT FALSE,
    motivo_edicao TEXT,
    hash_integridade TEXT,
    cor TEXT,
    device_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT registros_saida_after_entrada CHECK (
        saida IS NULL OR saida >= entrada
    )
);

-- Índices
CREATE INDEX idx_registros_user_id ON public.registros(user_id);
CREATE INDEX idx_registros_entrada ON public.registros(entrada DESC);
CREATE INDEX idx_registros_user_entrada ON public.registros(user_id, entrada DESC);
CREATE INDEX idx_registros_local ON public.registros(local_id);
CREATE INDEX idx_registros_abertos ON public.registros(user_id) 
    WHERE saida IS NULL;

-- ============================================
-- TABELA: sync_log (para debug/auditoria)
-- ============================================
CREATE TABLE public.sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_id TEXT,
    action TEXT NOT NULL, -- 'push' | 'pull' | 'conflict'
    table_name TEXT NOT NULL,
    record_id UUID,
    status TEXT NOT NULL, -- 'success' | 'error'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_log_user ON public.sync_log(user_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuário só vê seus próprios dados
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Policies para locais
CREATE POLICY "Users can view own locais"
    ON public.locais FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own locais"
    ON public.locais FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locais"
    ON public.locais FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own locais"
    ON public.locais FOR DELETE
    USING (auth.uid() = user_id);

-- Policies para registros
CREATE POLICY "Users can view own registros"
    ON public.registros FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own registros"
    ON public.registros FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registros"
    ON public.registros FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own registros"
    ON public.registros FOR DELETE
    USING (auth.uid() = user_id);

-- Policies para sync_log
CREATE POLICY "Users can view own sync_log"
    ON public.sync_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync_log"
    ON public.sync_log FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Função para calcular horas trabalhadas
CREATE OR REPLACE FUNCTION calculate_work_hours(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    local_nome TEXT,
    total_hours NUMERIC,
    total_records INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.local_nome,
        ROUND(SUM(EXTRACT(EPOCH FROM (r.saida - r.entrada)) / 3600)::NUMERIC, 2) as total_hours,
        COUNT(*)::INTEGER as total_records
    FROM public.registros r
    WHERE r.user_id = p_user_id
      AND r.saida IS NOT NULL
      AND r.entrada::DATE >= p_start_date
      AND r.entrada::DATE <= p_end_date
      AND r.tipo = 'trabalho'
    GROUP BY r.local_nome
    ORDER BY total_hours DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS para updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_locais_updated_at
    BEFORE UPDATE ON public.locais
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

### 5.3 Schema SQLite Local (Mobile)

```typescript
// database/schema.ts

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
  -- Locais (cache do servidor + locais não sincronizados)
  CREATE TABLE IF NOT EXISTS locais (
    id TEXT PRIMARY KEY,
    server_id TEXT,
    nome TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    raio INTEGER DEFAULT 50,
    cor TEXT DEFAULT '#3B82F6',
    ativo INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    pending_sync INTEGER DEFAULT 0
  );

  -- Registros de ponto
  CREATE TABLE IF NOT EXISTS registros (
    id TEXT PRIMARY KEY,
    server_id TEXT,
    local_id TEXT,
    local_nome TEXT NOT NULL,
    entrada TEXT NOT NULL,
    saida TEXT,
    tipo TEXT DEFAULT 'trabalho',
    editado_manualmente INTEGER DEFAULT 0,
    motivo_edicao TEXT,
    hash_integridade TEXT,
    cor TEXT,
    created_at TEXT NOT NULL,
    synced_at TEXT,
    pending_sync INTEGER DEFAULT 0
  );

  -- Fila de sincronização
  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    payload TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TEXT NOT NULL
  );

  -- Configurações locais
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- Índices
  CREATE INDEX IF NOT EXISTS idx_registros_entrada ON registros(entrada DESC);
  CREATE INDEX IF NOT EXISTS idx_registros_pending ON registros(pending_sync) WHERE pending_sync = 1;
  CREATE INDEX IF NOT EXISTS idx_locais_pending ON locais(pending_sync) WHERE pending_sync = 1;
  CREATE INDEX IF NOT EXISTS idx_sync_queue_pending ON sync_queue(attempts) WHERE attempts < 5;
`;
```

---

## 6. Fluxos Principais

### 6.1 Fluxo de Autenticação

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │     │  App    │     │Supabase │     │ SQLite  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │  Abre app     │               │               │
     │──────────────▶│               │               │
     │               │               │               │
     │               │ Verifica token local          │
     │               │──────────────────────────────▶│
     │               │◀──────────────────────────────│
     │               │               │               │
     │  [Se token válido]            │               │
     │◀──────────────│               │               │
     │  Vai para Home│               │               │
     │               │               │               │
     │  [Se sem token ou expirado]   │               │
     │               │               │               │
     │  Tela Login   │               │               │
     │◀──────────────│               │               │
     │               │               │               │
     │  Email/Senha  │               │               │
     │──────────────▶│               │               │
     │               │ signInWithPassword            │
     │               │──────────────▶│               │
     │               │               │               │
     │               │ JWT + User    │               │
     │               │◀──────────────│               │
     │               │               │               │
     │               │ Salva token   │               │
     │               │──────────────────────────────▶│
     │               │               │               │
     │               │ Busca profile │               │
     │               │──────────────▶│               │
     │               │◀──────────────│               │
     │               │               │               │
     │               │ Busca locais  │               │
     │               │──────────────▶│               │
     │               │◀──────────────│               │
     │               │               │               │
     │               │ Cache local   │               │
     │               │──────────────────────────────▶│
     │               │               │               │
     │  Home Screen  │               │               │
     │◀──────────────│               │               │
     │               │               │               │
```

### 6.2 Fluxo de Geofence (Core do App)

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│   OS    │     │GPS Lib  │     │  App    │     │ SQLite  │     │Supabase │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │               │
     │ Geofence      │               │               │               │
     │ ENTER event   │               │               │               │
     │──────────────▶│               │               │               │
     │               │               │               │               │
     │               │ onGeofenceEnter               │               │
     │               │──────────────▶│               │               │
     │               │               │               │               │
     │               │               │ Busca local   │               │
     │               │               │──────────────▶│               │
     │               │               │◀──────────────│               │
     │               │               │               │               │
     │               │               │ Verifica horário              │
     │               │               │ (05:00-22:00) │               │
     │               │               │               │               │
     │               │               │ [Se dentro do horário]        │
     │               │               │               │               │
     │               │               │ Mostra notificação            │
     │               │◀──────────────│               │               │
     │               │               │               │               │
     │               │ "Você chegou  │               │               │
     │               │  em [Local]"  │               │               │
     │               │               │               │               │
     │               │ [Opções:]     │               │               │
     │               │ • Trabalhar   │               │               │
     │               │ • Visita      │               │               │
     │               │ • Ignorar     │               │               │
     │               │ • Daqui 30min │               │               │
     │               │               │               │               │
     │  User toca    │               │               │               │
     │  "Trabalhar"  │               │               │               │
     │──────────────────────────────▶│               │               │
     │               │               │               │               │
     │               │               │ Cria registro │               │
     │               │               │ (entrada=now) │               │
     │               │               │──────────────▶│               │
     │               │               │               │               │
     │               │               │ Add sync_queue│               │
     │               │               │──────────────▶│               │
     │               │               │               │               │
     │               │               │ [Se online]   │               │
     │               │               │ POST registro │               │
     │               │               │──────────────────────────────▶│
     │               │               │               │               │
     │               │               │ Inicia timer  │               │
     │               │               │ na UI         │               │
     │               │               │               │               │
     │ [30 seg sem resposta]         │               │               │
     │               │               │               │               │
     │               │ Auto-action   │               │               │
     │               │ (trabalhar)   │               │               │
     │               │──────────────▶│               │               │
     │               │               │               │               │
```

### 6.3 Fluxo de Saída da Geofence

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│   OS    │     │GPS Lib  │     │  App    │     │ SQLite  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ Geofence      │               │               │
     │ EXIT event    │               │               │
     │──────────────▶│               │               │
     │               │               │               │
     │               │ onGeofenceExit│               │
     │               │──────────────▶│               │
     │               │               │               │
     │               │               │ Verifica se   │
     │               │               │ está trabalhando
     │               │               │──────────────▶│
     │               │               │◀──────────────│
     │               │               │               │
     │               │               │ [Se trabalhando]
     │               │               │               │
     │               │               │ Mostra notificação
     │               │◀──────────────│               │
     │               │               │               │
     │               │ "Você saiu de │               │
     │               │  [Local]"     │               │
     │               │               │               │
     │               │ [Opções:]     │               │
     │               │ • Encerrar agora              │
     │               │ • Marcar 30min atrás          │
     │               │ • Continuar contando          │
     │               │               │               │
     │  User toca    │               │               │
     │  "Encerrar"   │               │               │
     │──────────────────────────────▶│               │
     │               │               │               │
     │               │               │ UPDATE registro
     │               │               │ (saida=now)   │
     │               │               │──────────────▶│
     │               │               │               │
     │               │               │ Gera hash     │
     │               │               │ integridade   │
     │               │               │──────────────▶│
     │               │               │               │
     │               │               │ Para timer UI │
     │               │               │               │
```

### 6.4 Fluxo de Sincronização

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  App    │     │ SQLite  │     │  Sync   │     │Supabase │
│ (UI)    │     │         │     │ Service │     │         │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │               │               │ [A cada 5min] │
     │               │               │ ou [Ao abrir] │
     │               │               │               │
     │               │ SELECT * FROM │               │
     │               │ sync_queue    │               │
     │               │◀──────────────│               │
     │               │──────────────▶│               │
     │               │               │               │
     │               │               │ [Para cada item]
     │               │               │               │
     │               │               │ POST/PUT/DELETE
     │               │               │──────────────▶│
     │               │               │               │
     │               │               │ [Se sucesso]  │
     │               │               │◀──────────────│
     │               │               │               │
     │               │ DELETE FROM   │               │
     │               │ sync_queue    │               │
     │               │◀──────────────│               │
     │               │               │               │
     │               │ UPDATE        │               │
     │               │ synced_at     │               │
     │               │◀──────────────│               │
     │               │               │               │
     │               │               │ [Se erro]     │
     │               │               │◀──────────────│
     │               │               │               │
     │               │ UPDATE        │               │
     │               │ attempts++    │               │
     │               │◀──────────────│               │
     │               │               │               │
     │               │               │ [Se attempts>5]
     │               │               │ Marca como    │
     │               │               │ falha         │
     │               │               │               │
     │ Mostra badge  │               │               │
     │ "X não sync"  │               │               │
     │◀──────────────────────────────│               │
     │               │               │               │
```

### 6.5 Fluxo de Geração de Relatório

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │     │  App    │     │ SQLite  │     │  Share  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ Toca "Gerar   │               │               │
     │  Relatório"   │               │               │
     │──────────────▶│               │               │
     │               │               │               │
     │               │ SELECT        │               │
     │               │ registros     │               │
     │               │ WHERE data    │               │
     │               │──────────────▶│               │
     │               │◀──────────────│               │
     │               │               │               │
     │               │ Formata texto │               │
     │               │               │               │
     │               │ ┌────────────────────────┐   │
     │               │ │ RELATÓRIO DE HORAS     │   │
     │               │ │ ══════════════════════ │   │
     │               │ │                        │   │
     │               │ │ Período: 01/12 - 15/12 │   │
     │               │ │ Usuário: João Silva    │   │
     │               │ │                        │   │
     │               │ │ OBRA ALPHA             │   │
     │               │ │ ────────────────────── │   │
     │               │ │ 02/12 - 08:00 às 17:30 │   │
     │               │ │         (9h 30min)     │   │
     │               │ │ 03/12 - 07:45 às 16:00 │   │
     │               │ │         (8h 15min)     │   │
     │               │ │                        │   │
     │               │ │ TOTAL: 45h 30min       │   │
     │               │ │                        │   │
     │               │ │ ══════════════════════ │   │
     │               │ │ Verificação: #a3f2... │    │
     │               │ │ ✅ Relatório íntegro   │   │
     │               │ └────────────────────────┘   │
     │               │               │               │
     │               │ Abre Share    │               │
     │               │ Dialog        │               │
     │               │──────────────────────────────▶
     │               │               │               │
     │ Escolhe       │               │               │
     │ WhatsApp      │               │               │
     │──────────────────────────────────────────────▶
     │               │               │               │
```

---

## 7. Segurança e Privacidade

### 7.1 Autenticação

- **JWT (JSON Web Tokens)** via Supabase Auth
- **Refresh tokens** com rotação automática
- **Expiração:** Access token 1h, Refresh token 7 dias
- **Armazenamento seguro:** expo-secure-store (Keychain/Keystore)

### 7.2 Row Level Security (RLS)

Todas as tabelas têm RLS ativado. Cada usuário só pode ver/editar seus próprios dados:

```sql
-- Exemplo: usuário só vê seus registros
CREATE POLICY "Users can view own registros"
    ON public.registros FOR SELECT
    USING (auth.uid() = user_id);
```

### 7.3 Dados Sensíveis

| Dado | Classificação | Tratamento |
|------|---------------|------------|
| Email | PII | Criptografado em repouso (Supabase) |
| Coordenadas dos locais | Sensível | Armazenado no servidor |
| Histórico de posições | Sensível | NÃO armazenado (só eventos de entrada/saída) |
| Hash de integridade | Técnico | SHA256 com salt |

### 7.4 Permissões do App

```json
// app.json
{
  "expo": {
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "RECEIVE_BOOT_COMPLETED"
      ]
    },
    "ios": {
      "infoPlist": {
        "NSLocationAlwaysAndWhenInUseUsageDescription": 
          "Precisamos da sua localização para detectar automaticamente quando você chega ou sai dos seus locais de trabalho.",
        "NSLocationWhenInUseUsageDescription": 
          "Precisamos da sua localização para mostrar sua posição no mapa.",
        "UIBackgroundModes": ["location", "fetch"]
      }
    }
  }
}
```

### 7.5 LGPD Compliance

1. **Consentimento explícito:** Tela de onboarding explica uso do GPS
2. **Direito de acesso:** Usuário pode exportar todos os dados
3. **Direito de exclusão:** Botão "Deletar minha conta" apaga tudo
4. **Minimização:** Só coletamos o necessário (sem tracking contínuo)
5. **Transparência:** Política de privacidade clara no app

---

## 8. Infraestrutura e Deploy

### 8.1 Ambientes

| Ambiente | Propósito | Supabase Project | Vercel |
|----------|-----------|------------------|--------|
| **Development** | Desenvolvimento local | `onsite-dev` | localhost |
| **Staging** | Testes pré-produção | `onsite-staging` | staging.onsiteflow.app |
| **Production** | Usuários reais | `onsite-prod` | app.onsiteflow.app |

### 8.2 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test

  build-web:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm --filter web build

  build-mobile:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd apps/mobile && eas build --platform all --non-interactive
```

### 8.3 Deploy Mobile

```bash
# Build para teste interno (Android)
eas build --platform android --profile preview

# Build para produção
eas build --platform all --profile production

# Submit para stores
eas submit --platform android
eas submit --platform ios
```

### 8.4 Variáveis de Ambiente

```bash
# apps/mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Apenas server-side
```

---

## 9. Monitoramento e Analytics

### 9.1 Error Tracking

**Sentry** para captura de erros em produção:

```typescript
// apps/mobile/src/lib/sentry.ts
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0.2,
});
```

### 9.2 Analytics (Opcional - Futuro)

Se decidir implementar analytics, usar **PostHog** (open source, LGPD-friendly):

- Eventos anônimos e agregados
- Sem tracking de localização
- Usuário pode opt-out

### 9.3 Métricas de Negócio (Supabase Dashboard)

- Usuários ativos (DAU/MAU)
- Registros criados por dia
- Taxa de sincronização com sucesso
- Locais cadastrados por usuário

---

## 10. Cronograma de Desenvolvimento

### Fase 1: Setup (Semanas 1-2)

- [ ] Criar repositório monorepo
- [ ] Configurar Turborepo + pnpm
- [ ] Setup Expo + TypeScript
- [ ] Criar projeto Supabase
- [ ] Configurar CI básico
- [ ] Primeiro build no celular

**Entregável:** App rodando com tela de login

### Fase 2: Core Mobile (Semanas 3-6)

- [ ] Implementar SQLite local
- [ ] Telas básicas (Home, Map, History)
- [ ] Integrar GPS Background (TransistorSoft)
- [ ] Implementar detecção de geofence
- [ ] Sistema de notificações locais
- [ ] Timer de trabalho

**Entregável:** App detectando entrada/saída de geofences

### Fase 3: Sync & Cloud (Semanas 7-8)

- [ ] Implementar sync engine
- [ ] Retry automático
- [ ] Resolução de conflitos
- [ ] Indicador de status de sync

**Entregável:** Dados sincronizando com Supabase

### Fase 4: Web Admin (Semanas 9-10)

- [ ] Setup Next.js
- [ ] Dashboard com gráficos
- [ ] CRUD de locais no mapa
- [ ] Visualização de histórico
- [ ] Mesmo auth do mobile

**Entregável:** Dashboard web funcional

### Fase 5: Relatórios (Semanas 11-12)

- [ ] Geração de relatório texto
- [ ] Hash de integridade
- [ ] Exportação compartilhável
- [ ] Gráficos no mobile

**Entregável:** Relatórios exportáveis

### Fase 6: Polish (Semanas 13-14)

- [ ] Testes em dispositivos reais (3+ Android, 2+ iOS)
- [ ] Otimização de bateria
- [ ] Ajustes de UX
- [ ] Tratamento de edge cases
- [ ] Onboarding flow

**Entregável:** App estável para beta

### Fase 7: Beta (Semanas 15-16)

- [ ] Deploy na Play Store (teste interno)
- [ ] Convite para beta testers (10-20 usuários)
- [ ] Coleta de feedback
- [ ] Correção de bugs críticos
- [ ] Preparação para lançamento

**Entregável:** Versão beta validada

---

## 11. Riscos e Mitigações

### 11.1 Riscos Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| GPS Background falha em alguns Androids | Alta | Alto | Guia de permissões, fallback para verificação manual |
| iOS mata o app em background | Média | Alto | Significant location changes + alertas ao usuário |
| Bateria drena rápido | Média | Médio | Configurações de intervalo, modo economia |
| Conflitos de sync | Baixa | Médio | Last-write-wins + log de conflitos |
| SQLite corrompido | Muito Baixa | Alto | Backup automático + recovery |

### 11.2 Riscos de Negócio

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Usuários não entendem permissões | Alta | Médio | Onboarding explicativo com imagens |
| Poucos usuários ativos | Média | Alto | Foco em UX simples, feedback rápido |
| Custo de infraestrutura cresce | Baixa | Médio | Monitoramento de uso, otimização de queries |

### 11.3 Plano de Contingência

**Se GPS Background não funcionar bem:**
1. Implementar "check-in manual com um toque"
2. Manter geofence como "sugestão" (notifica, mas não auto-registra)
3. Pivotar para modelo híbrido

**Se custo de licença for bloqueante:**
1. Testar alternativa open-source (react-native-background-geolocation-android)
2. Implementar solução própria com WorkManager (Android) / BGTaskScheduler (iOS)
3. Aceitar limitações e documentar

---

## 12. Glossário

| Termo | Definição |
|-------|-----------|
| **Geofence** | Cerca virtual definida por coordenadas e raio |
| **Check-in** | Registro de entrada em um local de trabalho |
| **Check-out** | Registro de saída de um local de trabalho |
| **Offline-First** | Arquitetura onde o app funciona sem internet |
| **RLS** | Row Level Security - controle de acesso por linha no PostgreSQL |
| **Sync Queue** | Fila de operações pendentes para sincronização |
| **Hash de Integridade** | Código que permite verificar se dados foram alterados |
| **Edge Function** | Função serverless executada próxima ao usuário |
| **EAS** | Expo Application Services - serviço de build da Expo |

---

## Histórico de Revisões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | Dez/2024 | Claude + Dev | Documento inicial |

---

**Próximo documento:** [DATABASE.md](./DATABASE.md) - Detalhes completos do banco de dados
