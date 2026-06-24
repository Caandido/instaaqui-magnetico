# InstaAqui Magnético

SaaS de Inteligência Competitiva para Instagram. Monitora concorrentes e gera ideias,
roteiros, tendências, gaps, alertas e relatórios.

> Documentação completa, passo a passo, em `ESTRUTURA-DO-PROJETO.txt` e na pasta `docs/`.

## Stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind v4**
- **Prisma 6** + **PostgreSQL** (multi-tenant)
- **Auth.js (NextAuth v5)** — login por e-mail/senha
- Apify (coleta, Fase 1), Claude/Anthropic (IA, Fase 2), Stripe + Inngest (Fase 3)

## Pré-requisitos

- Node.js 20+
- Um banco PostgreSQL (Neon ou Supabase — ambos têm plano grátis)

## Setup (passo a passo)

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env       # (Windows: copy .env.example .env)
#   -> preencha DATABASE_URL com a string do Neon/Supabase
#   -> AUTH_SECRET já vem preenchido no .env (ou gere outro: npx auth secret)

# 3. Criar as tabelas no banco
npx prisma migrate dev --name init

# 4. Rodar em desenvolvimento
npm run dev          # http://localhost:3000
```

Ferramentas úteis:

```bash
npx prisma studio    # visualizar/editar o banco
npm run build        # build de produção
```

## Status das fases

- [x] **Fase 0 — Fundação** (Next.js, Prisma, Auth.js, multi-tenant)
- [ ] Fase 1 — Coleta (Apify)
- [ ] Fase 2 — Motor de IA (7 agentes)
- [ ] Fase 3 — SaaS (Stripe, agendamento, alertas)
- [ ] Fase 4 — Frontend / Dashboards

## Estrutura (Fase 0)

```
src/
├── app/
│   ├── (auth)/login, (auth)/signup     # telas de login e cadastro
│   ├── (app)/layout.tsx, dashboard     # área logada (protegida) + seletor de workspace
│   ├── actions/org.ts                  # server action: trocar workspace
│   ├── api/auth/[...nextauth]          # rota do Auth.js
│   └── api/auth/signup                 # cadastro (User + Organization + Membership)
├── lib/
│   ├── db.ts                           # conexão Prisma
│   ├── auth.ts                         # configuração NextAuth
│   └── org.ts                          # helpers multi-tenant
├── components/workspace-switcher.tsx
└── types/next-auth.d.ts
prisma/schema.prisma                    # tabelas User/Organization/Membership/Subscription (+ Auth.js)
```
