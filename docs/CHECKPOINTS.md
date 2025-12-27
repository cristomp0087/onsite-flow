# OnSite Flow — Checkpoints de Implementação

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Metodologia:** Desenvolvimento em Blocos Testáveis

---

## 📋 Filosofia dos Checkpoints

Cada checkpoint segue o princípio **"Não avança sem verde"**:

```
┌─────────────────────────────────────────────────────────────┐
│                    REGRA DE OURO                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Todos os testes passando                                │
│  ✅ Logs funcionando e visíveis                             │
│  ✅ Documentação atualizada                                 │
│  ✅ Você consegue demonstrar funcionando                    │
│                                                             │
│  Só então → Próximo checkpoint                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗺️ Visão Geral dos Checkpoints

```
CHECKPOINT 0: Fundação
    ↓ (1-2 dias)
CHECKPOINT 1: Backend Supabase  
    ↓ (3-4 dias)
CHECKPOINT 2: App Mobile Esqueleto
    ↓ (3-4 dias)
CHECKPOINT 3: GPS e Geofence
    ↓ (5-7 dias)
CHECKPOINT 4: Banco Local + Sync
    ↓ (4-5 dias)
CHECKPOINT 5: Relatórios e Exportação
    ↓ (3-4 dias)
CHECKPOINT 6: Dashboard Web
    ↓ (4-5 dias)
CHECKPOINT 7: Polish e Beta
    ↓ (5-7 dias)
🚀 LANÇAMENTO BETA
```

**Tempo total estimado:** 28-38 dias úteis (~6-8 semanas)

---

## 📊 Sistema de Logs Centralizado

Antes de começar, vamos criar um sistema de logs que você poderá acessar via web.

### Arquitetura de Logs

```
┌─────────────────────────────────────────────────────────────┐
│                      FONTES DE LOG                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📱 Mobile App ──────┐                                      │
│     • GPS events     │                                      │
│     • Geofence       │      ┌─────────────────────────┐    │
│     • Sync status    │      │                         │    │
│     • Errors         ├─────▶│   SUPABASE             │    │
│                      │      │   logs table           │    │
│  🖥️ Web Admin ───────┤      │                         │    │
│     • Auth events    │      │   + Edge Function      │    │
│     • CRUD actions   │      │   para alertas         │    │
│                      │      │                         │    │
│  ☁️ Backend ─────────┘      └───────────┬─────────────┘    │
│     • API calls                         │                   │
│     • Sync conflicts                    │                   │
│     • Errors                            ▼                   │
│                              ┌─────────────────────────┐    │
│                              │   LOG VIEWER WEB       │    │
│                              │   /admin/logs          │    │
│                              │                         │    │
│                              │   • Filtros por tipo   │    │
│                              │   • Busca por período  │    │
│                              │   • Alertas em tempo   │    │
│                              │     real               │    │
│                              └─────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Níveis de Log

| Nível | Cor | Uso | Exemplo |
|-------|-----|-----|---------|
| `DEBUG` | 🔵 Azul | Desenvolvimento apenas | "GPS position updated: lat, lng" |
| `INFO` | 🟢 Verde | Operações normais | "User logged in" |
| `WARN` | 🟡 Amarelo | Situações suspeitas | "Sync retry attempt 2/5" |
| `ERROR` | 🔴 Vermelho | Falhas que precisam atenção | "Database connection failed" |
| `SECURITY` | 🟣 Roxo | Eventos de segurança | "Invalid token detected" |

### Categorias de Log

```typescript
enum LogCategory {
  AUTH = 'auth',           // Login, logout, token refresh
  GPS = 'gps',             // Posição, permissões
  GEOFENCE = 'geofence',   // Entrada/saída de cercas
  SYNC = 'sync',           // Sincronização com servidor
  DATABASE = 'database',   // Operações de banco
  API = 'api',             // Chamadas HTTP
  SECURITY = 'security',   // Tentativas suspeitas
  PERFORMANCE = 'perf',    // Tempos de resposta
}
```

---

## ✅ CHECKPOINT 0: Fundação

**Objetivo:** Ambiente de desenvolvimento funcionando

**Duração estimada:** 1-2 dias

### Tarefas

- [ ] Criar conta no Supabase (projeto `onsite-dev`)
- [ ] Criar conta no GitHub (repositório `onsite-flow`)
- [ ] Instalar Node.js 20+, pnpm, VS Code
- [ ] Criar estrutura inicial do monorepo
- [ ] Configurar ESLint + Prettier + TypeScript
- [ ] Configurar Turborepo
- [ ] Primeiro commit

### Estrutura de Pastas Inicial

```
onsite-flow/
├── apps/
│   ├── mobile/          # (vazio por enquanto)
│   └── web/             # (vazio por enquanto)
├── packages/
│   └── shared/          # Types compartilhados
├── supabase/
│   └── migrations/      # SQL do banco
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CHECKPOINTS.md   # Este documento
│   └── LOGS.md
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .eslintrc.js
├── .prettierrc
├── .gitignore
└── README.md
```

### Critérios de Pronto (Definition of Done)

| # | Critério | Como Testar |
|---|----------|-------------|
| 1 | Monorepo criado | `pnpm install` roda sem erros |
| 2 | TypeScript configurado | `pnpm typecheck` passa |
| 3 | Linting funcionando | `pnpm lint` passa |
| 4 | Git funcionando | Commit e push para GitHub |
| 5 | Supabase acessível | Login no dashboard funciona |

### Comando de Validação

```bash
# Rodar no terminal para validar checkpoint 0
pnpm install && pnpm lint && pnpm typecheck && echo "✅ CHECKPOINT 0 COMPLETO"
```

---

## ✅ CHECKPOINT 1: Backend Supabase

**Objetivo:** Banco de dados e autenticação funcionando

**Duração estimada:** 3-4 dias

### Tarefas

- [ ] Criar tabelas no Supabase (profiles, locais, registros)
- [ ] Configurar Row Level Security (RLS)
- [ ] Criar tabela de logs
- [ ] Configurar Supabase Auth (email/senha)
- [ ] Criar Edge Function para teste
- [ ] Criar página de visualização de logs
- [ ] Testar CRUD via Supabase Dashboard

### Schema de Logs

```sql
-- Tabela de logs centralizada
CREATE TABLE public.app_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'security')),
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id),
    device_id TEXT,
    app_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX idx_logs_timestamp ON public.app_logs(timestamp DESC);
CREATE INDEX idx_logs_level ON public.app_logs(level);
CREATE INDEX idx_logs_category ON public.app_logs(category);
CREATE INDEX idx_logs_user ON public.app_logs(user_id);

-- RLS: Admin vê tudo, usuário vê só seus logs
ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;

-- Policy para inserção (qualquer usuário autenticado)
CREATE POLICY "Users can insert own logs"
    ON public.app_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy para leitura (por enquanto, todos podem ler para debug)
-- Em produção, restringir a admins
CREATE POLICY "Authenticated users can read logs"
    ON public.app_logs FOR SELECT
    USING (auth.role() = 'authenticated');
```

### Critérios de Pronto

| # | Critério | Como Testar |
|---|----------|-------------|
| 1 | Tabelas criadas | Ver no Supabase Dashboard → Table Editor |
| 2 | RLS ativo | Tentar acessar sem auth = erro 401 |
| 3 | Auth funcionando | Criar usuário teste, fazer login |
| 4 | Logs funcionando | Inserir log via SQL, ver na tabela |
| 5 | CRUD testado | Criar/ler/atualizar/deletar local |

### Testes Manuais

```sql
-- Teste 1: Criar usuário (via Supabase Auth Dashboard)
-- Email: teste@onsite.app
-- Senha: Teste123!

-- Teste 2: Inserir log
INSERT INTO app_logs (level, category, message, metadata)
VALUES ('info', 'test', 'Checkpoint 1 test', '{"test": true}');

-- Teste 3: Verificar RLS
-- Deslogar e tentar SELECT → deve falhar

-- Teste 4: Criar local
INSERT INTO locais (user_id, nome, latitude, longitude, raio)
VALUES ('SEU_USER_ID', 'Local Teste', -23.5505, -46.6333, 50);

-- Teste 5: Verificar que user só vê seus dados
-- Criar segundo usuário, tentar ver locais do primeiro → vazio
```

### Comando de Validação

```bash
# Script que vamos criar para testar o backend
pnpm --filter @onsite/shared test:supabase
```

---

## ✅ CHECKPOINT 2: App Mobile Esqueleto

**Objetivo:** App rodando no celular com navegação e auth

**Duração estimada:** 3-4 dias

### Tarefas

- [ ] Criar projeto Expo com TypeScript
- [ ] Configurar Expo Router (navegação)
- [ ] Criar telas básicas (Login, Home, Map, History, Settings)
- [ ] Integrar Supabase Auth
- [ ] Implementar sistema de logs no app
- [ ] Criar componentes base (Button, Input, Card)
- [ ] Testar no celular físico

### Estrutura do App

```
apps/mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/
│   │   ├── index.tsx        # Home
│   │   ├── map.tsx
│   │   ├── history.tsx
│   │   ├── settings.tsx
│   │   └── _layout.tsx
│   ├── _layout.tsx          # Root layout
│   └── +not-found.tsx
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Card.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── logger.ts        # Sistema de logs
│   ├── stores/
│   │   └── authStore.ts
│   └── constants/
│       └── colors.ts
├── app.json
├── eas.json
├── tsconfig.json
└── package.json
```

### Sistema de Logs Mobile

```typescript
// src/lib/logger.ts
import { supabase } from './supabase';
import * as Device from 'expo-device';
import * as Application from 'expo-application';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'security';
type LogCategory = 'auth' | 'gps' | 'geofence' | 'sync' | 'database' | 'api' | 'security' | 'perf';

interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: Record<string, unknown>;
}

// Fila de logs (envia em batch)
const logQueue: LogEntry[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

// Configuração
const CONFIG = {
  flushInterval: 10000,    // 10 segundos
  maxQueueSize: 50,        // Máximo de logs na fila
  enableConsole: __DEV__,  // Console log em dev
  enableRemote: true,      // Enviar para Supabase
};

/**
 * Registra um log
 */
export function log(
  level: LogLevel,
  category: LogCategory,
  message: string,
  metadata?: Record<string, unknown>
) {
  const entry: LogEntry = { level, category, message, metadata };
  
  // Console em desenvolvimento
  if (CONFIG.enableConsole) {
    const emoji = {
      debug: '🔵',
      info: '🟢',
      warn: '🟡',
      error: '🔴',
      security: '🟣',
    }[level];
    console.log(`${emoji} [${category.toUpperCase()}] ${message}`, metadata || '');
  }
  
  // Adiciona à fila
  if (CONFIG.enableRemote) {
    logQueue.push(entry);
    
    // Flush se fila cheia
    if (logQueue.length >= CONFIG.maxQueueSize) {
      flushLogs();
    }
    
    // Agenda flush
    if (!flushTimeout) {
      flushTimeout = setTimeout(flushLogs, CONFIG.flushInterval);
    }
  }
}

/**
 * Envia logs para o servidor
 */
async function flushLogs() {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  
  if (logQueue.length === 0) return;
  
  const logsToSend = [...logQueue];
  logQueue.length = 0;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const entries = logsToSend.map(entry => ({
      level: entry.level,
      category: entry.category,
      message: entry.message,
      metadata: entry.metadata || {},
      user_id: user?.id,
      device_id: Device.modelName,
      app_version: Application.nativeApplicationVersion,
    }));
    
    await supabase.from('app_logs').insert(entries);
  } catch (error) {
    // Não deixa erro de log quebrar o app
    if (__DEV__) console.error('Failed to flush logs:', error);
  }
}

// Helpers
export const logger = {
  debug: (cat: LogCategory, msg: string, meta?: Record<string, unknown>) => log('debug', cat, msg, meta),
  info: (cat: LogCategory, msg: string, meta?: Record<string, unknown>) => log('info', cat, msg, meta),
  warn: (cat: LogCategory, msg: string, meta?: Record<string, unknown>) => log('warn', cat, msg, meta),
  error: (cat: LogCategory, msg: string, meta?: Record<string, unknown>) => log('error', cat, msg, meta),
  security: (cat: LogCategory, msg: string, meta?: Record<string, unknown>) => log('security', cat, msg, meta),
};

// Flush ao fechar o app
import { AppState } from 'react-native';
AppState.addEventListener('change', (state) => {
  if (state === 'background') {
    flushLogs();
  }
});
```

### Critérios de Pronto

| # | Critério | Como Testar |
|---|----------|-------------|
| 1 | App inicia | Expo Go abre sem crash |
| 2 | Navegação funciona | Trocar entre tabs |
| 3 | Login funciona | Fazer login com usuário teste |
| 4 | Logout funciona | Sair e voltar para tela de login |
| 5 | Logs aparecem | Ver logs no Supabase após ações |
| 6 | Roda em dispositivo | Testar em celular físico (não emulador) |

### Testes no Celular

```
1. Instalar Expo Go no celular
2. Rodar `pnpm --filter mobile start`
3. Escanear QR code
4. Testar:
   - [ ] Tela de login aparece
   - [ ] Criar conta funciona
   - [ ] Login funciona
   - [ ] Navegar entre tabs funciona
   - [ ] Logout funciona
   - [ ] Logs aparecem no Supabase
```

---

## ✅ CHECKPOINT 3: GPS e Geofence

**Objetivo:** Detecção de entrada/saída funcionando

**Duração estimada:** 5-7 dias

### Tarefas

- [ ] Configurar react-native-background-geolocation
- [ ] Implementar solicitação de permissões
- [ ] Criar serviço de GPS
- [ ] Implementar lógica de geofence
- [ ] Criar notificações locais
- [ ] Implementar auto-ação (30 segundos)
- [ ] Tela de cadastro de local no mapa
- [ ] Testar em campo (ir até um local real)

### Fluxo de Geofence

```
┌─────────────────────────────────────────────────────────────┐
│                  FLUXO DE GEOFENCE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. ENTRADA DETECTADA                                       │
│     │                                                       │
│     ├── Log: "geofence_enter" (INFO)                       │
│     │                                                       │
│     ├── Verifica horário (05:00 - 22:00)                   │
│     │   ├── Fora do horário → Log + Ignora                 │
│     │   └── Dentro do horário → Continua                   │
│     │                                                       │
│     ├── Mostra notificação                                 │
│     │   "Você chegou em [Local]"                           │
│     │   [Trabalhar] [Visita] [Ignorar] [30min]             │
│     │                                                       │
│     ├── Timer de 30 segundos                               │
│     │   └── Se não responder → Auto "Trabalhar"            │
│     │                                                       │
│     └── Log: "checkin_created" (INFO)                      │
│                                                             │
│  2. SAÍDA DETECTADA                                         │
│     │                                                       │
│     ├── Log: "geofence_exit" (INFO)                        │
│     │                                                       │
│     ├── Verifica se está trabalhando                       │
│     │   ├── Não está → Ignora                              │
│     │   └── Está → Continua                                │
│     │                                                       │
│     ├── Mostra notificação                                 │
│     │   "Você saiu de [Local]"                             │
│     │   [Encerrar] [30min atrás] [Continuar]               │
│     │                                                       │
│     ├── Timer de 30 segundos                               │
│     │   └── Se não responder → Auto "Encerrar"             │
│     │                                                       │
│     └── Log: "checkout_created" (INFO)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Logs Críticos do GPS

```typescript
// Logs que DEVEM ser registrados

// Permissões
logger.info('gps', 'Permission requested', { type: 'always' });
logger.info('gps', 'Permission granted', { type: 'always' });
logger.warn('gps', 'Permission denied', { type: 'always' });
logger.security('gps', 'Permission revoked by user');

// GPS Status
logger.info('gps', 'GPS started');
logger.info('gps', 'GPS stopped');
logger.warn('gps', 'GPS signal lost', { lastKnown: coords });
logger.error('gps', 'GPS error', { code: error.code, message: error.message });

// Geofence
logger.info('geofence', 'Geofence registered', { localId, nome, raio });
logger.info('geofence', 'Geofence enter', { localId, nome });
logger.info('geofence', 'Geofence exit', { localId, nome });
logger.warn('geofence', 'Geofence event outside work hours', { hora: '23:45' });

// Ações do usuário
logger.info('geofence', 'User action: work', { localId, responseTime: '5s' });
logger.info('geofence', 'User action: visit', { localId });
logger.info('geofence', 'User action: ignore', { localId });
logger.info('geofence', 'Auto action: work', { localId, reason: 'timeout' });
```

### Critérios de Pronto

| # | Critério | Como Testar |
|---|----------|-------------|
| 1 | Permissão GPS solicitada | Abrir app → pede permissão |
| 2 | Posição exibida | Mapa mostra localização atual |
| 3 | Cadastrar local funciona | Criar local no mapa |
| 4 | Geofence registrada | Log mostra "Geofence registered" |
| 5 | Notificação aparece | Entrar na área → notificação |
| 6 | Check-in funciona | Tocar "Trabalhar" → timer inicia |
| 7 | Check-out funciona | Sair da área → timer para |
| 8 | Auto-ação funciona | Não responder → ação automática |
| 9 | Funciona em background | App fechado → ainda detecta |
| 10 | Logs completos | Todos os eventos aparecem no log |

### Teste de Campo

```
ROTEIRO DE TESTE (fazer pessoalmente):

1. Preparação
   - [ ] Carregar celular 100%
   - [ ] Escolher local de teste (ex: uma praça)
   - [ ] Cadastrar local no app com raio de 50m

2. Teste de Entrada
   - [ ] Sair da área do local (>50m)
   - [ ] Caminhar em direção ao local
   - [ ] Ao entrar, notificação deve aparecer
   - [ ] Tocar "Trabalhar"
   - [ ] Timer deve iniciar

3. Teste de Saída
   - [ ] Caminhar para fora da área
   - [ ] Notificação de saída deve aparecer
   - [ ] Tocar "Encerrar"
   - [ ] Timer deve parar

4. Teste de Background
   - [ ] Repetir teste com app fechado
   - [ ] Notificação ainda deve aparecer

5. Teste de Auto-Ação
   - [ ] Entrar na área
   - [ ] NÃO tocar na notificação
   - [ ] Após 30s, check-in automático

6. Verificar Logs
   - [ ] Abrir Supabase
   - [ ] Verificar se todos os eventos foram logados
```

---

## ✅ CHECKPOINT 4: Banco Local + Sync

**Objetivo:** Dados persistem offline e sincronizam

**Duração estimada:** 4-5 dias

### Tarefas

- [ ] Implementar SQLite local
- [ ] Criar operações CRUD locais
- [ ] Implementar fila de sincronização
- [ ] Criar serviço de sync
- [ ] Tratamento de conflitos
- [ ] Indicador de status de sync na UI
- [ ] Testar offline → online

### Fluxo de Sync

```
┌─────────────────────────────────────────────────────────────┐
│                   FLUXO DE SINCRONIZAÇÃO                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  OPERAÇÃO LOCAL                                             │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────┐     ┌─────────────┐                       │
│  │   SQLite    │────▶│ sync_queue  │                       │
│  │  (dados)    │     │  (pendente) │                       │
│  └─────────────┘     └──────┬──────┘                       │
│                             │                               │
│                             ▼                               │
│                    ┌─────────────────┐                     │
│                    │  Sync Service   │                     │
│                    │  (background)   │                     │
│                    └────────┬────────┘                     │
│                             │                               │
│              ┌──────────────┴──────────────┐               │
│              ▼                              ▼               │
│       [ONLINE]                       [OFFLINE]             │
│          │                               │                  │
│          ▼                               ▼                  │
│   ┌─────────────┐                 Mantém na fila           │
│   │  Supabase   │                 Tenta novamente          │
│   │  (cloud)    │                 quando online            │
│   └──────┬──────┘                                          │
│          │                                                  │
│          ▼                                                  │
│   ┌─────────────────┐                                      │
│   │ Atualiza SQLite │                                      │
│   │ synced_at = now │                                      │
│   │ Remove da fila  │                                      │
│   └─────────────────┘                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Logs Críticos do Sync

```typescript
// Operações de banco
logger.debug('database', 'INSERT registro', { id, localNome });
logger.debug('database', 'UPDATE registro', { id, saida });
logger.debug('database', 'DELETE registro', { id });

// Sincronização
logger.info('sync', 'Sync started', { queueSize: 5 });
logger.info('sync', 'Sync item success', { table: 'registros', id });
logger.warn('sync', 'Sync item failed, will retry', { table, id, attempt: 2 });
logger.error('sync', 'Sync item failed permanently', { table, id, error });
logger.info('sync', 'Sync completed', { success: 4, failed: 1 });

// Conflitos
logger.warn('sync', 'Conflict detected', { table, id, resolution: 'server-wins' });

// Status de rede
logger.info('sync', 'Network online');
logger.warn('sync', 'Network offline');
```

### Critérios de Pronto

| # | Critério | Como Testar |
|---|----------|-------------|
| 1 | Dados salvos localmente | Criar registro, fechar app, reabrir |
| 2 | Funciona offline | Modo avião → criar registro → funciona |
| 3 | Sync automático | Voltar online → dados aparecem no Supabase |
| 4 | Fila de sync visível | UI mostra "3 pendentes" |
| 5 | Retry funciona | Falha de rede → tenta novamente |
| 6 | Conflito resolvido | Editar mesmo registro em 2 lugares |
| 7 | Logs completos | Todas operações de sync logadas |

### Teste Offline

```
ROTEIRO DE TESTE OFFLINE:

1. Preparação
   - [ ] Ter alguns registros já sincronizados
   - [ ] Verificar que app está online (indicador verde)

2. Ir Offline
   - [ ] Ativar modo avião
   - [ ] App deve mostrar indicador offline

3. Criar Dados Offline
   - [ ] Fazer check-in manual
   - [ ] Editar um registro existente
   - [ ] Criar um novo local
   - [ ] App deve mostrar "3 pendentes"

4. Verificar Persistência
   - [ ] Fechar app completamente
   - [ ] Reabrir app
   - [ ] Dados offline ainda estão lá
   - [ ] Ainda mostra "3 pendentes"

5. Voltar Online
   - [ ] Desativar modo avião
   - [ ] Aguardar sync automático
   - [ ] Indicador deve ficar verde
   - [ ] "0 pendentes"

6. Verificar Supabase
   - [ ] Abrir Supabase Dashboard
   - [ ] Dados devem estar lá
   - [ ] Logs de sync devem aparecer
```

---

## ✅ CHECKPOINT 5: Relatórios e Exportação

**Objetivo:** Gerar e compartilhar relatórios

**Duração estimada:** 3-4 dias

### Tarefas

- [ ] Criar tela de relatórios
- [ ] Implementar filtros (período, local)
- [ ] Gerar relatório em texto formatado
- [ ] Implementar hash de integridade
- [ ] Integrar com Share do sistema
- [ ] Criar gráficos básicos
- [ ] Marcar registros editados manualmente

### Formato do Relatório

```
══════════════════════════════════════════════════════════════
                    RELATÓRIO DE HORAS
                       OnSite Flow
══════════════════════════════════════════════════════════════

📅 Período: 01/12/2024 a 15/12/2024
👤 Usuário: João Silva
📧 Email: joao@email.com

──────────────────────────────────────────────────────────────

📍 OBRA ALPHA
   Endereço aproximado: São Paulo, SP

   02/12/2024 (Segunda)
   ├─ Entrada: 08:00
   ├─ Saída:   17:30
   └─ Total:   9h 30min

   03/12/2024 (Terça)
   ├─ Entrada: 07:45
   ├─ Saída:   16:00
   └─ Total:   8h 15min
   
   ⚠️ 05/12/2024 (Quinta) - EDITADO MANUALMENTE
   ├─ Entrada: 08:00 (original: 08:15)
   ├─ Saída:   17:00
   └─ Total:   9h 00min

   Subtotal Obra Alpha: 26h 45min (3 dias)

──────────────────────────────────────────────────────────────

📍 OBRA BETA
   Endereço aproximado: Campinas, SP

   04/12/2024 (Quarta)
   ├─ Entrada: 09:00
   ├─ Saída:   18:00
   └─ Total:   9h 00min

   Subtotal Obra Beta: 9h 00min (1 dia)

══════════════════════════════════════════════════════════════

📊 RESUMO

   Total de horas:     35h 45min
   Total de dias:      4 dias
   Média por dia:      8h 56min
   Locais visitados:   2

══════════════════════════════════════════════════════════════

🔐 VERIFICAÇÃO DE INTEGRIDADE

   Hash: a3f2b8c9d4e5...
   Status: ✅ Relatório íntegro
   
   Este relatório foi gerado automaticamente pelo OnSite Flow.
   Qualquer alteração manual invalida a verificação acima.

──────────────────────────────────────────────────────────────
Gerado em: 15/12/2024 às 14:30
OnSite Flow v1.0.0 | onsiteflow.app
══════════════════════════════════════════════════════════════
```

### Critérios de Pronto

| # | Critério | Como Testar |
|---|----------|-------------|
| 1 | Tela de relatórios | Navegar para tela de relatórios |
| 2 | Filtro por período | Selecionar datas → relatório filtra |
| 3 | Filtro por local | Selecionar local → relatório filtra |
| 4 | Texto formatado | Relatório legível e organizado |
| 5 | Hash funciona | Hash aparece no final |
| 6 | Edição marcada | Registro editado mostra aviso |
| 7 | Compartilhar funciona | Tocar compartilhar → WhatsApp abre |
| 8 | Gráficos aparecem | Gráfico de horas por local |

---

## ✅ CHECKPOINT 6: Dashboard Web

**Objetivo:** Admin web funcionando

**Duração estimada:** 4-5 dias

### Tarefas

- [ ] Criar projeto Next.js
- [ ] Implementar autenticação (mesmo login do mobile)
- [ ] Dashboard com métricas
- [ ] CRUD de locais com mapa
- [ ] Visualização de histórico
- [ ] **Página de logs (/admin/logs)**
- [ ] Exportação de dados
- [ ] Deploy na Vercel

### Página de Logs (Crítico!)

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Log Viewer                                    [Refresh] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Filtros:                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Level    ▼  │ │ Category ▼  │ │ Período: Hoje    ▼  │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
│                                                             │
│  ┌───────────┐                                             │
│  │ 🔍 Buscar │ [___________________________________]       │
│  └───────────┘                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⏰ 14:32:05  🔴 ERROR  [SYNC]                             │
│  Sync item failed permanently                               │
│  { "table": "registros", "id": "abc123", "error": "..." }  │
│                                                             │
│  ⏰ 14:31:42  🟢 INFO   [GEOFENCE]                         │
│  Geofence enter                                             │
│  { "localId": "xyz789", "nome": "Obra Alpha" }             │
│                                                             │
│  ⏰ 14:30:15  🟡 WARN   [GPS]                              │
│  GPS signal lost                                            │
│  { "lastKnown": { "lat": -23.55, "lng": -46.63 } }         │
│                                                             │
│  ⏰ 14:28:00  🟢 INFO   [AUTH]                             │
│  User logged in                                             │
│  { "userId": "user123" }                                   │
│                                                             │
│  ⏰ 14:25:33  🟣 SECURITY  [AUTH]                          │
│  Invalid token detected                                     │
│  { "reason": "expired", "userId": "user456" }              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Mostrando 50 de 1.234 logs          [< Anterior] [Próx >] │
└─────────────────────────────────────────────────────────────┘
```

### Critérios de Pronto

| # | Critério | Como Testar |
|---|----------|-------------|
| 1 | Login funciona | Mesmo usuário do mobile |
| 2 | Dashboard carrega | Métricas aparecem |
| 3 | Mapa funciona | Ver locais no mapa |
| 4 | CRUD de locais | Criar/editar/deletar local |
| 5 | Histórico funciona | Ver registros do usuário |
| 6 | **Logs funcionam** | Ver logs em tempo real |
| 7 | Filtros de log | Filtrar por level/category |
| 8 | Deploy funciona | Acessar via URL pública |

### URL do Log Viewer

```
Desenvolvimento: http://localhost:3000/admin/logs
Produção:        https://app.onsiteflow.com/admin/logs
```

---

## ✅ CHECKPOINT 7: Polish e Beta

**Objetivo:** App pronto para usuários reais

**Duração estimada:** 5-7 dias

### Tarefas

- [ ] Testes em 3+ dispositivos Android diferentes
- [ ] Testes em 2+ dispositivos iOS
- [ ] Onboarding flow (explicação de permissões)
- [ ] Tratamento de todos os erros
- [ ] Otimização de bateria
- [ ] Revisão de UI/UX
- [ ] Política de privacidade
- [ ] Termos de uso
- [ ] Build de produção
- [ ] Submit para Play Store (teste interno)

### Checklist de Qualidade

```
DISPOSITIVOS TESTADOS:
- [ ] Samsung Galaxy (Android 12+)
- [ ] Xiaomi/Redmi (MIUI)
- [ ] Motorola (Android puro)
- [ ] iPhone 12+ (iOS 16+)
- [ ] iPhone SE (tela menor)

CENÁRIOS TESTADOS:
- [ ] Primeiro uso (onboarding)
- [ ] Uso normal por 1 dia inteiro
- [ ] App em background por 8 horas
- [ ] Bateria baixa (<20%)
- [ ] Sem internet por 2 horas
- [ ] Reinstalação do app
- [ ] Atualização do app

EDGE CASES:
- [ ] GPS desligado
- [ ] Permissão negada
- [ ] Memória baixa
- [ ] Múltiplos locais próximos
- [ ] Timezone diferente
- [ ] Mudança de horário de verão
```

### Critérios de Pronto

| # | Critério | Como Testar |
|---|----------|-------------|
| 1 | Zero crashes | 1 dia de uso sem crash |
| 2 | Bateria OK | <10% de consumo em 8h |
| 3 | Onboarding claro | Novo usuário entende sozinho |
| 4 | Erros tratados | Mensagens amigáveis |
| 5 | Build produção | APK/IPA gerado sem erros |
| 6 | Play Store | Upload aceito |
| 7 | Beta testers | 5+ pessoas usando |

---

## 📊 Resumo Visual

```
┌─────────────────────────────────────────────────────────────┐
│                   JORNADA DE CHECKPOINTS                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CP0 ──▶ CP1 ──▶ CP2 ──▶ CP3 ──▶ CP4 ──▶ CP5 ──▶ CP6 ──▶ CP7│
│   │       │       │       │       │       │       │       │ │
│   │       │       │       │       │       │       │       │ │
│   ▼       ▼       ▼       ▼       ▼       ▼       ▼       ▼ │
│ Setup  Backend  Mobile   GPS    Sync   Report   Web    Beta │
│        Logs     Auth   Geofence SQLite Export  Admin  Test  │
│                                                             │
│  📁      🗄️      📱      📍      💾      📄      🖥️     🚀  │
│                                                             │
│  ────────────────────────────────────────────────────────── │
│  Semana:  1    1-2     2-3     3-4     4-5     5-6    6-8   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

LEGENDA:
✅ = Todos os critérios passando
🟡 = Em progresso
⬜ = Não iniciado
```

---

## 🔗 Próximos Passos

Após você revisar este documento, começaremos pelo **Checkpoint 0: Fundação**.

Vou criar:
1. Estrutura do monorepo
2. Configurações de TypeScript/ESLint
3. README com instruções de setup
4. Script de validação do checkpoint

**Confirme que entendeu a estrutura e podemos começar!**
