# OnSite Flow - Checkpoint 6: Sincronização Supabase

## 📦 Arquivos

### Para o Mobile (`apps/mobile/`)
| Arquivo | Destino |
|---------|---------|
| `sync.ts` | `src/lib/sync.ts` ⭐ **NOVO** |
| `syncStore.ts` | `src/stores/syncStore.ts` ⭐ **NOVO** |

### Para o Web (`apps/web/`)
| Arquivo | Destino |
|---------|---------|
| `database.ts` | `src/types/database.ts` ⚠️ **SUBSTITUIR** |
| `sessoesStore.ts` | `src/stores/sessoesStore.ts` ⚠️ **SUBSTITUIR** |

---

## 🔧 Dependências Mobile

```bash
cd apps/mobile
npx expo install @react-native-community/netinfo
```

---

## 📊 Estrutura do Supabase

### Tabela `locais`
```sql
id            uuid PRIMARY KEY
user_id       uuid REFERENCES auth.users
nome          text
latitude      float8
longitude     float8
raio          int4 DEFAULT 100
cor           text
ativo         bool DEFAULT true
created_at    timestamptz
updated_at    timestamptz
```

### Tabela `registros`
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

## 🔄 Como Funciona a Sincronização

### Fluxo de Dados

```
┌─────────────────┐     ┌─────────────────┐
│  Mobile App     │     │    Supabase     │
│  (SQLite)       │◄───►│   (PostgreSQL)  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │    sync.ts            │
         │   ┌─────────┐         │
         └──►│ Upload  │─────────┘
             │ Download│
             └─────────┘
                 │
                 ▼
         ┌─────────────────┐
         │    Web App      │
         │  (lê Supabase)  │
         └─────────────────┘
```

### Estratégia de Sync

1. **Salvar Local**
   - Dados salvos no SQLite imediatamente
   - Marcados como `synced_at = NULL`

2. **Upload (quando online)**
   - Busca itens com `synced_at IS NULL`
   - Envia para Supabase via `upsert`
   - Marca como sincronizado

3. **Download**
   - Baixa dados dos últimos 30 dias
   - Insere/atualiza no SQLite local
   - Resolve conflitos: remoto ganha se mais recente

4. **Auto-sync**
   - Ao abrir app
   - Quando volta de offline para online
   - Após salvar novo registro

---

## 🛠️ Uso no Mobile

### Inicializar (no App.tsx ou _layout.tsx)
```typescript
import { useSyncStore } from './src/stores/syncStore';

// No useEffect de inicialização
const { initialize } = useSyncStore();
await initialize();
```

### Sync Manual
```typescript
const { syncNow, isSyncing, lastSyncAt } = useSyncStore();

// Botão de sync
<Button 
  onPress={syncNow} 
  disabled={isSyncing}
  title={isSyncing ? 'Sincronizando...' : 'Sincronizar'}
/>

// Mostrar última sync
<Text>Última sync: {lastSyncAt?.toLocaleString()}</Text>
```

### Salvar com Sync Automático
```typescript
import { salvarRegistroComSync } from './src/lib/sync';

// Em vez de salvar só no SQLite:
await salvarRegistroComSync(userId, {
  local_id: 'xxx',
  local_nome: 'Obra Centro',
  entrada: new Date().toISOString(),
});
```

---

## ⚠️ Importante

### RLS (Row Level Security)
As tabelas do Supabase precisam ter RLS configurado:

```sql
-- Locais
ALTER TABLE locais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own locais" ON locais
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own locais" ON locais
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locais" ON locais
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own locais" ON locais
  FOR DELETE USING (auth.uid() = user_id);

-- Registros
ALTER TABLE registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own registros" ON registros
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own registros" ON registros
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registros" ON registros
  FOR UPDATE USING (auth.uid() = user_id);
```

### Conflitos
- Se o mesmo registro for editado no mobile e no web, **o mais recente ganha**
- Dados locais nunca são perdidos (ficam no SQLite)
- Em caso de dúvida, dados são preservados em ambos

---

## 🧪 Testando

1. **No Mobile:**
   - Adicione um local
   - Inicie/encerre uma sessão
   - Verifique nos logs: `[sync] Registros synced`

2. **No Supabase:**
   - Vá em Table Editor → `registros`
   - Os dados devem aparecer

3. **No Web:**
   - Faça login com mesmo usuário
   - Dashboard deve mostrar os dados

---

## 📱 Indicador de Sync na UI

Sugestão de componente para mostrar status:

```typescript
function SyncIndicator() {
  const { isOnline, isSyncing, pendingCount } = useSyncStore();
  
  if (!isOnline) {
    return <Text style={{ color: 'orange' }}>⚠️ Offline</Text>;
  }
  
  if (isSyncing) {
    return <Text style={{ color: 'blue' }}>🔄 Sincronizando...</Text>;
  }
  
  if (pendingCount > 0) {
    return <Text style={{ color: 'yellow' }}>⏳ {pendingCount} pendentes</Text>;
  }
  
  return <Text style={{ color: 'green' }}>✓ Sincronizado</Text>;
}
```
