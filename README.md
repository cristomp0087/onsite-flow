# OnSite Flow

> App de ponto por geofencing - Registre suas horas automaticamente

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-blue.svg)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

---

## 📱 Sobre o Projeto

O **OnSite Flow** permite que trabalhadores autônomos registrem suas horas de trabalho automaticamente usando geofencing. Basta definir seus locais de trabalho no mapa, e o app detecta quando você entra ou sai, registrando o tempo trabalhado.

### Funcionalidades Principais

- 📍 **Geofencing automático** - Detecta entrada/saída de locais
- ⏱️ **Cronômetro de trabalho** - Contagem em tempo real
- 📊 **Relatórios** - Exporte e compartilhe suas horas
- 🔒 **Offline-first** - Funciona sem internet
- 🔐 **Privacidade** - Seus dados, seu controle

---

## 🏗️ Estrutura do Projeto

Este é um **monorepo** gerenciado com [Turborepo](https://turbo.build/) e [pnpm](https://pnpm.io/).

```
onsite-flow/
├── apps/
│   ├── mobile/          # App React Native (Expo)
│   └── web/             # Dashboard Next.js
├── packages/
│   └── shared/          # Código compartilhado (types, utils)
├── supabase/
│   ├── migrations/      # SQL do banco de dados
│   └── functions/       # Edge Functions
└── docs/                # Documentação
```

---

## 🚀 Começando

### Pré-requisitos

- **Node.js** 20+ ([download](https://nodejs.org/))
- **pnpm** 8+ (`npm install -g pnpm`)
- **Git** ([download](https://git-scm.com/))

### Instalação

```bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/onsite-flow.git
cd onsite-flow

# Instale as dependências
pnpm install

# Verifique se tudo está funcionando
pnpm validate
```

### Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Inicia todos os apps em modo desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm lint` | Verifica código com ESLint |
| `pnpm lint:fix` | Corrige erros de lint automaticamente |
| `pnpm typecheck` | Verifica tipos TypeScript |
| `pnpm format` | Formata código com Prettier |
| `pnpm validate` | Roda lint + typecheck + format |
| `pnpm clean` | Limpa cache e node_modules |

---

## 📦 Pacotes

### @onsite/mobile

App mobile React Native com Expo. Funcionalidades:
- GPS em background
- Detecção de geofence
- Banco de dados local (SQLite)
- Sincronização com servidor

**Status:** 🔴 Não iniciado (Checkpoint 2)

### @onsite/web

Dashboard web Next.js. Funcionalidades:
- Gerenciamento de locais
- Visualização de histórico
- Relatórios e gráficos
- Visualizador de logs

**Status:** 🔴 Não iniciado (Checkpoint 6)

### @onsite/shared

Código compartilhado entre mobile e web:
- Types TypeScript
- Constantes (cores, configurações)
- Utilitários (datas, hash, geolocalização)

**Status:** ✅ Implementado (Checkpoint 0)

---

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Expo (mobile)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Execute as migrations em `supabase/migrations/`
4. Copie as chaves para `.env.local`

---

## 📋 Checkpoints de Desenvolvimento

| CP | Nome | Status |
|----|------|--------|
| 0 | Fundação (Monorepo) | ✅ Completo |
| 1 | Backend Supabase | 🔴 Não iniciado |
| 2 | Mobile Esqueleto | 🔴 Não iniciado |
| 3 | GPS + Geofence | 🔴 Não iniciado |
| 4 | Banco Local + Sync | 🔴 Não iniciado |
| 5 | Relatórios | 🔴 Não iniciado |
| 6 | Dashboard Web | 🔴 Não iniciado |
| 7 | Polish + Beta | 🔴 Não iniciado |

Veja [docs/CHECKPOINTS.md](docs/CHECKPOINTS.md) para detalhes.

---

## 🧪 Testes

```bash
# Validação completa (sem testes unitários ainda)
pnpm validate

# Lint apenas
pnpm lint

# TypeScript apenas
pnpm typecheck
```

---

## 📄 Documentação

- [Arquitetura](docs/ARCHITECTURE.md) - Visão geral do sistema
- [Checkpoints](docs/CHECKPOINTS.md) - Plano de desenvolvimento
- [Metadados e Ética](docs/METADATA_ETHICS.md) - Uso responsável de dados

---

## 🤝 Contribuindo

Este é um projeto privado. Contribuições são bem-vindas apenas de membros autorizados.

### Fluxo de Trabalho

1. Crie uma branch: `git checkout -b feature/nome-da-feature`
2. Faça commits descritivos
3. Rode `pnpm validate` antes de push
4. Abra um Pull Request

### Convenções de Commit

```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentação
style: formatação (não afeta código)
refactor: refatoração
test: adiciona testes
chore: tarefas de manutenção
```

---

## 📜 Licença

Todos os direitos reservados © OnSite Club 2024

Este software é proprietário e confidencial.

---

## 📞 Contato

- **Email:** suporte@onsiteclub.com
- **Website:** https://onsiteflow.app
