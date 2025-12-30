# 📦 Checkpoint 0 - Guia de Aplicação

## 🎯 O que você recebeu

Todos os arquivos corrigidos/criados para o **CP0: Fundação**.

---

## 📋 Arquivos para SUBSTITUIR no seu projeto

Copie estes arquivos **substituindo** os existentes:

```
✅ SUBSTITUIR:
├── package.json              # Dependências corrigidas
├── tsconfig.json             # TypeScript corrigido
├── .eslintrc.js              # ESLint completo
├── .prettierrc               # Prettier configurado
├── .prettierignore           # Prettier ignore
├── .gitignore                # Gitignore completo
├── .env.example              # Vars documentadas
├── turbo.json                # OK (já estava bom)
├── pnpm-workspace.yaml       # OK (já estava bom)
└── README.md                 # README atualizado
```

---

## 📁 Arquivos NOVOS para criar

Copie estes arquivos que **não existiam**:

```
✅ CRIAR:
├── validate-cp0.sh           # Script de validação
├── packages/shared/
│   ├── package.json          # Novo pacote
│   ├── tsconfig.json         # Config do shared
│   └── src/
│       ├── index.ts          # Exports principais
│       ├── types/
│       │   └── index.ts      # Types do DB
│       ├── utils/
│       │   └── index.ts      # Funções úteis
│       └── constants/
│           └── index.ts      # Constantes
├── docs/
│   ├── ARCHITECTURE.md       # Arquitetura
│   └── CHECKPOINTS.md        # Roadmap
├── apps/mobile/.gitkeep
├── apps/web/.gitkeep
└── supabase/migrations/.gitkeep
```

---

## 🚀 Como aplicar no seu projeto

### 1. Faça backup (segurança)

```bash
cd /caminho/do/seu/projeto/onsite-flow
git add .
git commit -m "backup: antes do CP0"
```

### 2. Substitua os arquivos

```bash
# Copie os arquivos baixados para seu projeto
# Substitua os que já existem
# Crie os que não existem
```

### 3. Instale as dependências

```bash
pnpm install
```

### 4. Valide o CP0

```bash
chmod +x validate-cp0.sh
./validate-cp0.sh
```

### 5. Se tudo ✅, commit

```bash
git add .
git commit -m "chore: checkpoint 0 - fundação completa"
```

---

## ⚠️ Se der erro no validate-cp0.sh

### Erro: "pnpm não encontrado"

```bash
npm install -g pnpm
```

### Erro: "TypeScript errors"

```bash
# Normal se apps/mobile e apps/web ainda não existem
# Ignore se só der erro nesses paths
```

### Erro: "Prettier formatting"

```bash
# Rode para formatar tudo:
pnpm format
```

---

## 🎉 Quando tudo estiver ✅

Você estará pronto para o **CP1: Supabase Core**!

---

## 📞 Estrutura Final do CP0

Após aplicar tudo, seu projeto deve estar assim:

```
onsite-flow/
├── .eslintrc.js           ✅
├── .prettierrc            ✅
├── .prettierignore        ✅
├── .gitignore             ✅
├── .env.example           ✅
├── package.json           ✅
├── pnpm-workspace.yaml    ✅
├── tsconfig.json          ✅
├── turbo.json             ✅
├── validate-cp0.sh        ✅
├── README.md              ✅
│
├── packages/
│   └── shared/
│       ├── package.json         ✅
│       ├── tsconfig.json        ✅
│       └── src/
│           ├── index.ts         ✅
│           ├── types/           ✅
│           ├── utils/           ✅
│           └── constants/       ✅
│
├── apps/
│   ├── mobile/           📁 (vazio - CP2)
│   └── web/              📁 (vazio - CP6)
│
├── supabase/             📁 (vazio - CP1)
│   └── migrations/
│
└── docs/
    ├── ARCHITECTURE.md   ✅
    └── CHECKPOINTS.md    ✅
```

---

## ✅ Checklist Final

Antes de avançar para CP1, confirme:

- [ ] Todos os arquivos copiados
- [ ] `pnpm install` rodou sem erros
- [ ] `./validate-cp0.sh` passou com ✅
- [ ] Commit feito no Git
- [ ] `.env.local` ainda NÃO existe (vai criar no CP1)

---

**Pronto?** Peça o **CP1: Supabase Core**! 🚀
