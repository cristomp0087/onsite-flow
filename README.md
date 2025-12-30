# OnSite Flow - Correções v5.3 (Checkpoint)

## 📦 Arquivos

| Arquivo | Destino |
|---------|---------|
| `locationStore.ts` | `apps/mobile/src/stores/locationStore.ts` |
| `workSessionStore.ts` | `apps/mobile/src/stores/workSessionStore.ts` |
| `registroStore.ts` | `apps/mobile/src/stores/registroStore.ts` |
| `settingsStore.ts` | `apps/mobile/src/stores/settingsStore.ts` ⭐ **NOVO** |
| `notifications.ts` | `apps/mobile/src/lib/notifications.ts` |
| `reports.ts` | `apps/mobile/src/lib/reports.ts` |
| `index.tsx` | `apps/mobile/app/(tabs)/index.tsx` |
| `history.tsx` | `apps/mobile/app/(tabs)/history.tsx` |
| `map.tsx` | `apps/mobile/app/(tabs)/map.tsx` |
| `settings.tsx` | `apps/mobile/app/(tabs)/settings.tsx` ⭐ **NOVO** |
| `GeofenceAlert.tsx` | `apps/mobile/src/components/GeofenceAlert.tsx` |

---

## ✅ Novidades v5.3

### 1. Botões "Há X min" (passado)
- **Antes:** "Em 10 min" (agendava futuro)
- **Agora:** "Há 10 min" (desconta do total)

### 2. Tela de Configurações ⭐
Nova tela com opções personalizáveis:
- Popup de Saída: valores dos botões "Há X min"
- Popup de Entrada: valor do botão "Em X min"
- Countdown automático: 15s, 30s, 45s, 60s

### 3. Cronômetro Independente
- Cada fence = cronômetro próprio
- Reseta ao entrar em nova fence

### 4. Auto-Encerrar
- Saiu da fence → countdown → ENCERRA

---

## 📱 Tela de Configurações

- **Popup de Saída:** escolha 5, 10, 15, 20, 30, 45, 60 min para cada botão
- **Popup de Entrada:** escolha 5, 10, 15, 20, 30 min
- **Countdown:** escolha 15, 30, 45, 60 segundos

---

## ⚠️ Nota sobre Tab Bar

Adicione no `_layout.tsx`:

```tsx
<Tabs.Screen
  name="settings"
  options={{
    title: 'Configurações',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="settings-outline" size={size} color={color} />
    ),
  }}
/>
```

---

## 📁 Estrutura Final

```
apps/mobile/
├── app/(tabs)/
│   ├── index.tsx
│   ├── history.tsx
│   ├── map.tsx
│   └── settings.tsx      ⭐ NOVO
└── src/
    ├── components/
    │   └── GeofenceAlert.tsx
    ├── stores/
    │   ├── locationStore.ts
    │   ├── workSessionStore.ts
    │   ├── registroStore.ts
    │   └── settingsStore.ts  ⭐ NOVO
    └── lib/
        ├── notifications.ts
        └── reports.ts
```
