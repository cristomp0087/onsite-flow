# OnSite Flow — Uso Ético de Metadados e Analytics

**Documento Complementar à Arquitetura**  
**Versão:** 1.0  
**Data:** Dezembro 2024

---

## 📋 Índice

1. [O Que São Metadados](#1-o-que-são-metadados)
2. [Diferença Entre Dados Pessoais e Metadados Agregados](#2-diferença-entre-dados-pessoais-e-metadados-agregados)
3. [O Que Podemos Coletar Legalmente](#3-o-que-podemos-coletar-legalmente)
4. [O Que NUNCA Devemos Fazer](#4-o-que-nunca-devemos-fazer)
5. [Casos de Uso Éticos para o Negócio](#5-casos-de-uso-éticos-para-o-negócio)
6. [Implementação Técnica](#6-implementação-técnica)
7. [Transparência e Consentimento](#7-transparência-e-consentimento)
8. [Checklist de Compliance](#8-checklist-de-compliance)

---

## 1. O Que São Metadados

**Metadados** são "dados sobre dados". No contexto do OnSite Flow:

| Dado do Usuário (PII) | Metadado Derivado |
|----------------------|-------------------|
| João Silva trabalhou na Obra X das 8h às 17h | "Um usuário trabalhou 9 horas" |
| Coordenadas -23.5505, -46.6333 (São Paulo) | "Região: Grande São Paulo" |
| Email: joao@email.com | "Domínio do email: email.com" |
| 15 registros em dezembro | "Média de registros por usuário em dezembro" |

**A diferença crucial:** Metadados agregados e anonimizados não identificam indivíduos.

---

## 2. Diferença Entre Dados Pessoais e Metadados Agregados

### Dados Pessoais (Protegidos pela LGPD)

- Nome, email, telefone
- Localização exata (latitude/longitude)
- Histórico individual de trabalho
- Qualquer dado que identifique uma pessoa

### Metadados Agregados (Podem ser usados livremente)

- "85% dos usuários usam Android"
- "Média de 6.5 horas trabalhadas por dia"
- "Pico de uso às 8h da manhã"
- "30% dos usuários estão na região Sul"

**Regra de ouro:** Se com o dado eu consigo identificar QUEM é a pessoa, é dado pessoal. Se não consigo, é metadado agregado.

---

## 3. O Que Podemos Coletar Legalmente

### 3.1 Métricas de Uso do App (Analytics)

✅ **PERMITIDO** (com consentimento básico no aceite dos termos):

```
Métricas de Produto:
├── Usuários ativos diários/mensais (DAU/MAU)
├── Tempo médio de sessão
├── Telas mais acessadas
├── Taxa de conclusão de onboarding
├── Crashes e erros (sem dados pessoais)
├── Versão do app/OS mais usadas
└── Taxa de retenção (voltou após 7/30 dias?)

Métricas de Funcionalidade:
├── % de usuários que usam geofence vs manual
├── Número médio de locais cadastrados
├── Tamanho médio do raio das geofences
├── Horários de pico de check-in/check-out
└── Taxa de sincronização com sucesso
```

### 3.2 Dados Geográficos Agregados

✅ **PERMITIDO** (com anonimização):

```
Distribuição Geográfica:
├── % de usuários por estado/região
├── % de usuários em capitais vs interior
├── Densidade de uso por região (mapa de calor SEM identificação)
└── Fuso horário predominante

❌ NÃO PERMITIDO:
├── Localização exata de um usuário específico
├── Histórico de movimentação de um usuário
└── Cruzamento que permita identificar indivíduos
```

### 3.3 Dados de Comportamento Agregados

✅ **PERMITIDO**:

```
Padrões de Trabalho (agregados):
├── Média de horas trabalhadas por dia/semana
├── Dias da semana com mais atividade
├── Distribuição de tipos (trabalho vs visita)
├── % de registros editados manualmente
└── Tempo médio entre check-in e check-out

Padrões de Uso:
├── % que exporta relatórios
├── Canais de compartilhamento mais usados (WhatsApp, email)
├── Frequência de uso do dashboard web vs mobile
└── Features mais/menos usadas
```

---

## 4. O Que NUNCA Devemos Fazer

### 🚫 Proibições Absolutas

```
NUNCA:
├── Vender dados pessoais para terceiros
├── Compartilhar localização exata com terceiros
├── Criar perfis individuais para venda de ads
├── Rastrear usuários fora do contexto do app
├── Coletar dados sem consentimento claro
├── Armazenar mais dados do que o necessário
├── Manter dados após exclusão de conta
└── Usar dados para discriminação de qualquer tipo
```

### 🚫 Práticas Antiéticas Comuns (que não faremos)

1. **Shadow Profiles:** Criar perfis de pessoas que não usam o app
2. **Fingerprinting:** Identificar usuários por características do dispositivo
3. **Cross-App Tracking:** Rastrear comportamento em outros apps
4. **Venda de "Insights":** Vender análises que permitam identificar indivíduos
5. **Dark Patterns:** Enganar usuário para coletar mais dados

---

## 5. Casos de Uso Éticos para o Negócio

### 5.1 Melhoria do Produto

**Objetivo:** Tornar o app melhor para os usuários

```
Exemplo Prático:
┌─────────────────────────────────────────────────────────────┐
│ INSIGHT: 40% dos usuários abandonam o onboarding           │
│          na tela de permissão de GPS                       │
├─────────────────────────────────────────────────────────────┤
│ AÇÃO: Redesenhar tela com explicação mais clara            │
│       do porquê precisamos da permissão                    │
├─────────────────────────────────────────────────────────────┤
│ RESULTADO: Abandono cai para 15%                           │
└─────────────────────────────────────────────────────────────┘

Outros exemplos:
├── Descobrir que iOS mata o app → Alertar usuários sobre configuração
├── Muitos erros em Android 10 → Priorizar fix para essa versão
├── Poucos usam relatórios → Simplificar ou destacar a feature
└── Pico de uso às 6h → Garantir servidores prontos nesse horário
```

### 5.2 Decisões de Negócio

**Objetivo:** Entender o mercado para crescer de forma sustentável

```
Exemplo Prático:
┌─────────────────────────────────────────────────────────────┐
│ INSIGHT: 60% dos usuários estão no setor de construção     │
│          (inferido por horários de trabalho e termos usados│
│          nos nomes dos locais - SEM ler dados individuais) │
├─────────────────────────────────────────────────────────────┤
│ AÇÃO: Criar parceria com fornecedor de EPIs                │
│       Oferecer desconto no e-commerce para esse segmento   │
├─────────────────────────────────────────────────────────────┤
│ RESULTADO: Usuários ganham desconto, empresa ganha receita │
└─────────────────────────────────────────────────────────────┘

Outros exemplos:
├── Maioria no Sul → Fazer marketing regional focado
├── 70% usam Android → Priorizar otimização Android
├── Média de 3 locais por usuário → Planejar limites do tier gratuito
└── 20% exportam relatórios → Potencial para feature premium
```

### 5.3 Parcerias B2B (Futuro)

**Objetivo:** Oferecer valor para empresas SEM comprometer privacidade

```
Exemplo Ético:
┌─────────────────────────────────────────────────────────────┐
│ CENÁRIO: Construtora quer saber se app é usado no setor    │
├─────────────────────────────────────────────────────────────┤
│ O QUE PODEMOS COMPARTILHAR:                                │
│ • "65% dos usuários trabalham em horário comercial"        │
│ • "Média de 8h de jornada registrada"                      │
│ • "App funciona bem com bateria o dia todo"                │
├─────────────────────────────────────────────────────────────┤
│ O QUE NÃO COMPARTILHAMOS:                                  │
│ • Lista de usuários                                        │
│ • Localizações de obras                                    │
│ • Dados de indivíduos                                      │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Validação de Features (Futuro)

**Objetivo:** Decidir o que construir baseado em uso real

```
Exemplo:
┌─────────────────────────────────────────────────────────────┐
│ HIPÓTESE: Usuários querem feature de "Grupos/Equipes"      │
├─────────────────────────────────────────────────────────────┤
│ VALIDAÇÃO COM METADADOS:                                   │
│ • 35% compartilham relatórios frequentemente               │
│ • 20% têm locais com nomes similares (ex: "Obra Cliente X")│
│ • Feedback qualitativo menciona "meu encarregado quer ver" │
├─────────────────────────────────────────────────────────────┤
│ DECISÃO: Priorizar feature de grupos para v2               │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Implementação Técnica

### 6.1 Arquitetura de Analytics

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE APP                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐     ┌─────────────────────────────────┐   │
│  │  Evento Local   │────▶│  Analytics Service              │   │
│  │                 │     │                                 │   │
│  │ • screen_view   │     │  1. Remove PII                  │   │
│  │ • button_tap    │     │  2. Agrega dados                │   │
│  │ • geofence_enter│     │  3. Gera ID anônimo de sessão   │   │
│  │ • error         │     │  4. Envia batch (não real-time) │   │
│  └─────────────────┘     └─────────────────────────────────┘   │
│                                     │                           │
└─────────────────────────────────────┼───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ANALYTICS BACKEND                          │
│                   (Supabase ou PostHog)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    TABELA: events                        │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ id            │ UUID                                    │   │
│  │ session_id    │ UUID (anônimo, não vinculado a user)    │   │
│  │ event_name    │ TEXT (screen_view, button_tap, etc)     │   │
│  │ properties    │ JSONB (SEM PII)                         │   │
│  │ timestamp     │ TIMESTAMPTZ                             │   │
│  │ app_version   │ TEXT                                    │   │
│  │ os            │ TEXT (android/ios)                      │   │
│  │ region        │ TEXT (Sul, Sudeste - não cidade exata)  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Código de Exemplo (Analytics Ético)

```typescript
// src/services/analytics.ts

import { Platform } from 'react-native';
import * as Application from 'expo-application';
import { supabase } from '@/lib/supabase';

// ID de sessão anônimo (muda a cada abertura do app)
const sessionId = crypto.randomUUID();

// NUNCA incluir esses campos nos eventos
const PII_FIELDS = ['email', 'nome', 'user_id', 'latitude', 'longitude', 'local_nome'];

interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, unknown>;
}

// Fila de eventos (envia em batch, não real-time)
const eventQueue: AnalyticsEvent[] = [];

/**
 * Remove qualquer dado pessoal identificável
 */
function sanitizeProperties(props: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...props };
  
  for (const field of PII_FIELDS) {
    if (field in sanitized) {
      delete sanitized[field];
    }
  }
  
  // Anonimiza coordenadas para região
  if ('lat' in sanitized && 'lng' in sanitized) {
    sanitized.region = getRegionFromCoords(sanitized.lat as number, sanitized.lng as number);
    delete sanitized.lat;
    delete sanitized.lng;
  }
  
  return sanitized;
}

/**
 * Converte coordenadas em região genérica (sem cidade exata)
 */
function getRegionFromCoords(lat: number, lng: number): string {
  // Lógica simplificada - em produção usar reverse geocoding e agregar
  if (lat < -20) return 'sul';
  if (lat < -15) return 'sudeste';
  if (lat < -10) return 'centro-oeste';
  if (lat < -5) return 'nordeste';
  return 'norte';
}

/**
 * Registra evento de analytics
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  const sanitizedProps = properties ? sanitizeProperties(properties) : {};
  
  eventQueue.push({
    eventName,
    properties: {
      ...sanitizedProps,
      timestamp: new Date().toISOString(),
      sessionId,
      appVersion: Application.nativeApplicationVersion,
      os: Platform.OS,
      osVersion: Platform.Version,
    },
  });
  
  // Envia em batch a cada 10 eventos ou 60 segundos
  if (eventQueue.length >= 10) {
    flushEvents();
  }
}

/**
 * Envia eventos para o servidor
 */
async function flushEvents() {
  if (eventQueue.length === 0) return;
  
  const eventsToSend = [...eventQueue];
  eventQueue.length = 0;
  
  try {
    await supabase.from('analytics_events').insert(
      eventsToSend.map(e => ({
        event_name: e.eventName,
        properties: e.properties,
        session_id: sessionId,
      }))
    );
  } catch (error) {
    // Silently fail - analytics não pode quebrar o app
    console.warn('Analytics flush failed:', error);
  }
}

// Flush ao fechar o app
import { AppState } from 'react-native';
AppState.addEventListener('change', (state) => {
  if (state === 'background') {
    flushEvents();
  }
});

// ============================================
// EXEMPLOS DE USO
// ============================================

// ✅ CORRETO - Evento genérico
trackEvent('screen_view', { screen: 'home' });

// ✅ CORRETO - Ação sem PII
trackEvent('geofence_triggered', { 
  action: 'check_in', 
  trigger: 'automatic',
  // NÃO inclui local_nome ou coordenadas
});

// ✅ CORRETO - Erro sem stack trace com dados do usuário
trackEvent('error', { 
  type: 'sync_failed',
  code: 'NETWORK_ERROR',
  // NÃO inclui mensagem que pode ter email/nome
});

// ❌ ERRADO - Nunca fazer isso
// trackEvent('user_action', { 
//   userId: 'abc123',           // ❌ PII
//   email: 'joao@email.com',    // ❌ PII
//   location: { lat: -23.5, lng: -46.6 }, // ❌ PII
//   localNome: 'Obra do Cliente X',       // ❌ PII
// });
```

### 6.3 Dashboard de Métricas (Supabase)

```sql
-- View para métricas agregadas (sem PII)

CREATE VIEW analytics_dashboard AS
SELECT
  DATE_TRUNC('day', created_at) AS date,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(*) FILTER (WHERE event_name = 'screen_view') AS screen_views,
  COUNT(*) FILTER (WHERE event_name = 'geofence_triggered') AS geofence_events,
  COUNT(*) FILTER (WHERE event_name = 'report_exported') AS reports_exported,
  COUNT(*) FILTER (WHERE properties->>'os' = 'android') AS android_events,
  COUNT(*) FILTER (WHERE properties->>'os' = 'ios') AS ios_events
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Exemplo de output:
-- date       | unique_sessions | screen_views | geofence_events | reports_exported
-- 2024-12-20 | 150             | 2340         | 890             | 45
-- 2024-12-19 | 142             | 2180         | 856             | 38
```

---

## 7. Transparência e Consentimento

### 7.1 Política de Privacidade (Resumo)

O app deve ter uma política de privacidade clara que inclua:

```
RESUMO PARA O USUÁRIO:
┌─────────────────────────────────────────────────────────────┐
│                    O QUE COLETAMOS                          │
├─────────────────────────────────────────────────────────────┤
│ ✅ Seus registros de ponto (você controla)                  │
│ ✅ Locais que você cadastra (você controla)                 │
│ ✅ Métricas anônimas de uso (para melhorar o app)          │
├─────────────────────────────────────────────────────────────┤
│                    O QUE NÃO FAZEMOS                        │
├─────────────────────────────────────────────────────────────┤
│ ❌ Não rastreamos você fora dos seus locais                │
│ ❌ Não vendemos seus dados                                  │
│ ❌ Não compartilhamos sua localização com terceiros        │
│ ❌ Não guardamos histórico de onde você andou              │
├─────────────────────────────────────────────────────────────┤
│                    SEUS DIREITOS                            │
├─────────────────────────────────────────────────────────────┤
│ 📥 Exportar todos os seus dados                            │
│ 🗑️ Deletar sua conta e todos os dados                      │
│ 🔕 Desativar analytics (nas configurações)                 │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Tela de Consentimento (Onboarding)

```
┌─────────────────────────────────────────┐
│                                         │
│          🔒 Sua Privacidade             │
│                                         │
│  O OnSite Flow precisa da sua           │
│  localização para funcionar.            │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                         │
│  ✓ Só detectamos quando você           │
│    ENTRA ou SAI dos seus locais        │
│                                         │
│  ✓ Não rastreamos seus movimentos      │
│                                         │
│  ✓ Seus dados ficam no SEU celular     │
│    (sincroniza só se você quiser)      │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                         │
│  ☐ Aceito os Termos de Uso             │
│                                         │
│  ☐ Aceito compartilhar métricas        │
│    anônimas para melhorar o app        │
│    (opcional)                          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         CONTINUAR              │    │
│  └─────────────────────────────────┘   │
│                                         │
│  🔗 Ver Política de Privacidade        │
│                                         │
└─────────────────────────────────────────┘
```

### 7.3 Configurações de Privacidade (No App)

```
┌─────────────────────────────────────────┐
│                                         │
│  ⚙️ Privacidade e Dados                 │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                         │
│  Métricas anônimas          [  ON  ]   │
│  Ajuda a melhorar o app                │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                         │
│  📥 Exportar meus dados                │
│  Baixar todos os seus registros        │
│                                         │
│  🗑️ Deletar minha conta                │
│  Remove todos os dados permanentemente │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                         │
│  🔗 Política de Privacidade            │
│  🔗 Termos de Uso                      │
│                                         │
└─────────────────────────────────────────┘
```

---

## 8. Checklist de Compliance

### Antes do Lançamento

- [ ] Política de Privacidade publicada e acessível
- [ ] Termos de Uso publicados e acessíveis
- [ ] Tela de consentimento implementada
- [ ] Opção de opt-out de analytics funcionando
- [ ] Função "Exportar meus dados" funcionando
- [ ] Função "Deletar minha conta" funcionando
- [ ] RLS (Row Level Security) ativo em todas as tabelas
- [ ] Nenhum PII nos logs de erro
- [ ] Analytics não coleta PII
- [ ] Revisão de segurança do código

### Auditoria Periódica (Trimestral)

- [ ] Revisar quais dados estão sendo coletados
- [ ] Verificar se algum PII vazou para analytics
- [ ] Testar exclusão de conta (dados realmente somem?)
- [ ] Revisar logs em busca de PII acidental
- [ ] Atualizar Política de Privacidade se necessário

### Incidente de Dados (Se Acontecer)

- [ ] Identificar escopo do vazamento
- [ ] Notificar usuários afetados em 72h
- [ ] Documentar o incidente
- [ ] Implementar correção
- [ ] Reportar à ANPD (se necessário pela LGPD)

---

## Resumo Executivo

### O Que Você PODE Fazer com Metadados

1. **Melhorar o produto** baseado em padrões de uso agregados
2. **Tomar decisões de negócio** sobre regiões e segmentos
3. **Identificar bugs e problemas** sem expor dados individuais
4. **Apresentar números gerais** para parceiros ("X mil usuários ativos")
5. **Priorizar features** baseado em uso real

### O Que Você NUNCA Deve Fazer

1. **Vender ou compartilhar dados pessoais**
2. **Rastrear usuários além do necessário**
3. **Coletar sem consentimento claro**
4. **Manter dados após exclusão de conta**
5. **Criar perfis para publicidade**

### Princípio Guia

> "Se o usuário soubesse exatamente o que coletamos e como usamos, ele ficaria confortável?"

Se a resposta for "sim", está no caminho certo. Se houver dúvida, não colete.

---

**Documento criado em:** Dezembro 2024  
**Próxima revisão:** Março 2025
