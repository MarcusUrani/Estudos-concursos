# Estuda SEDES-DF

Plataforma web de estudos focada no concurso da **SEDES-DF**, com questões no estilo **QUADRIX**,
acompanhamento de desempenho e revisão inteligente (estilo Anki).

A arquitetura foi pensada para ser **reutilizável** em outros concursos (TJDFT, PCDF, CLDF, INSS,
CNU…): toda a infraestrutura — autenticação, simulados, métricas, revisão espaçada e estudo por
legislação — permanece igual; muda apenas o banco de conteúdo (assuntos e questões).

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Modelo de dados](#modelo-de-dados)
- [Conteúdo e banco de questões](#conteúdo-e-banco-de-questões)
- [Revisão espaçada](#revisão-espaçada)
- [Tema claro/escuro](#tema-claroescuro)
- [Autenticação](#autenticação)
- [Começando](#começando)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)
- [Deploy em produção](#deploy-em-produção-vercel--neon)
- [Reutilizar para outro concurso](#reutilizar-para-outro-concurso)
- [Roadmap](#roadmap)

---

## Funcionalidades

**Estudo e prática**

- **Treino livre** (`/treino`) — monta sessões com filtros por tema, nível, situação
  (todas / nunca respondidas / que errei / favoritas) e quantidade; correção imediata com
  comentário e base legal.
- **Simulado cronometrado** (`/simulado`) — tempo limite com relógio regressivo e auto-envio,
  mapa de questões, correção apenas no final com gabarito comentado e desempenho por tema.
- **Revisão espaçada** (`/revisao`) — fila estilo Anki com as questões “vencidas”; responder
  reagenda automaticamente a próxima revisão.
- **Flashcards** (`/flashcards`) — cartões gerados a partir das próprias questões (frente =
  enunciado; verso = alternativa correta + comentário + base legal); a auto-avaliação
  “sabia / não sabia” alimenta a mesma fila de revisão espaçada.
- **Estudo por legislação** (`/estudar`) — cada tema vira uma “legislação” com um resumo dos
  pontos-chave (consolidado a partir das explicações e bases legais das questões), e uma aba para
  **praticar** as questões relacionadas sem sair da leitura.

**Acompanhamento**

- **Dashboard** (`/dashboard`) — questões respondidas, percentual de acerto, tempo de estudo,
  revisões pendentes, desempenho por tema e destaque de temas dominados / a reforçar.
- **Favoritas** (`/favoritas`) e **Questões que errei** (`/erradas`) — listas dedicadas para
  revisar, nos modos **Responder** e **Visualizar**.
- **Histórico** (`/historico`) — todas as respostas agrupadas por dia, com filtros por resultado
  e por tema.
- **Conquistas** (`/conquistas`) — XP, níveis, sequência de dias (streak) e medalhas, derivados
  da atividade.

**Experiência**

- **Tema claro/escuro** com alternância manual e persistência da preferência.
- Interface responsiva, com animações sutis e um design system próprio.

---

## Stack

| Camada           | Tecnologia                                                                   |
| ---------------- | ---------------------------------------------------------------------------- |
| Framework        | **Next.js 16** (App Router) — front-end **e** back-end no mesmo app          |
| UI               | **React 19**, **Tailwind CSS v4**, componentes próprios estilo shadcn/ui     |
| Animações        | **Framer Motion**                                                            |
| Estado (cliente) | **TanStack React Query**                                                     |
| ORM / Banco      | **Prisma 6** + **SQLite** (desenvolvimento) → **PostgreSQL** (produção)      |
| Autenticação     | **Auth.js (NextAuth v5)** — credenciais, sessão por **JWT**, hash **bcrypt** |
| Ícones           | **lucide-react**                                                             |

---

## Arquitetura

A regra central: **UI** em `app/` e `components/`, **regras de negócio** em `server/`, e **acesso
a dados** centralizado em `lib/prisma.ts`. Isso mantém o domínio isolado da camada visual — se um
dia for preciso extrair um back-end dedicado (ex.: NestJS), basta migrar `src/server/*`.

```
estudos_concursos/
├─ prisma/
│  ├─ schema.prisma            # modelos do banco
│  ├─ seed.ts                  # cria assuntos/subassuntos + questões e o usuário inicial
│  ├─ seed-data/
│  │  ├─ tipos.ts              # tipo QSeed (formato de uma questão)
│  │  ├─ from-json.ts          # lê questoes.json, normaliza e mapeia para os assuntos canônicos
│  │  └─ index.ts              # agrega as questões e deriva a lista de assuntos/subassuntos
│  └─ dev.db                   # SQLite (gerado, não versionado)
├─ questoes.json               # banco de questões (fonte do seed; não versionado por padrão)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx            # layout raiz: providers, fontes e script anti-flash do tema
│  │  ├─ globals.css           # tema (claro/escuro) em Tailwind v4
│  │  ├─ page.tsx              # redireciona para /dashboard ou /login
│  │  ├─ login/                # tela de login (server action + formulário)
│  │  ├─ (app)/                # grupo de rotas PROTEGIDAS (exige sessão)
│  │  │  ├─ layout.tsx         # guard de autenticação + navegação lateral
│  │  │  ├─ dashboard/         # painel com estatísticas
│  │  │  ├─ treino/            # treino livre
│  │  │  ├─ revisao/           # revisão espaçada do dia
│  │  │  ├─ flashcards/        # sessão de flashcards
│  │  │  ├─ estudar/           # estudo por legislação (lista) + [assunto] (leitura/prática)
│  │  │  ├─ simulado/          # simulado cronometrado
│  │  │  ├─ favoritas/         # questões favoritadas
│  │  │  ├─ erradas/           # questões já erradas
│  │  │  ├─ historico/         # histórico de respostas
│  │  │  └─ conquistas/        # gamificação
│  │  └─ api/auth/[...nextauth]/  # rotas do Auth.js
│  ├─ auth.ts                  # configuração central do Auth.js
│  ├─ components/
│  │  ├─ ui/                   # Button, Card, Input, Label, Badge, Progress (design system)
│  │  ├─ nav.tsx               # navegação lateral
│  │  ├─ theme-toggle.tsx      # seletor de tema claro/escuro
│  │  ├─ treino-sessao.tsx     # componente reutilizável de resolução de questões
│  │  ├─ flashcard-sessao.tsx  # sessão de flashcards
│  │  ├─ simulado-sessao.tsx   # sessão de simulado
│  │  └─ providers.tsx         # SessionProvider + React Query
│  ├─ lib/
│  │  ├─ prisma.ts             # singleton do Prisma Client
│  │  └─ utils.ts              # helpers (cn, formatação, intervalos de revisão)
│  ├─ server/                  # lógica de servidor (server actions e queries)
│  │  ├─ treino.ts             # montar treino, responder, favoritar
│  │  ├─ revisao.ts            # fila de revisão espaçada (agendar e listar)
│  │  ├─ flashcards.ts         # gerar flashcards e registrar auto-avaliação
│  │  ├─ legislacao.ts         # lista de legislações e resumo derivado das questões
│  │  ├─ simulado.ts           # finalização e histórico de simulados
│  │  ├─ stats.ts              # estatísticas do dashboard
│  │  ├─ historico.ts          # histórico de respostas
│  │  ├─ gamificacao.ts        # XP, níveis, streak e medalhas
│  │  └─ auth-actions.ts       # logout
│  └─ types/                   # augmentations de tipos (next-auth)
```

**Convenções**

- **UI**: `src/components/ui/` é um design system próprio (estilo shadcn/ui) usando classes
  Tailwind concretas — não depende de variáveis CSS de tema externas.
- **Regras de negócio**: arquivos em `src/server/*` com `"use server"`. Por restrição do
  Next.js, esses arquivos só exportam funções assíncronas (tipos são permitidos).
- **Rotas protegidas** ficam no grupo `src/app/(app)/`; o `layout.tsx` do grupo faz o guard com
  `auth()` e redireciona para `/login` quando não há sessão.
- **SQLite** não tem arrays/enums nativos: `palavrasChave` é armazenado como CSV e `nivel` é uma
  string (`Facil | Medio | Dificil`).

---

## Modelo de dados

Definido em [`prisma/schema.prisma`](prisma/schema.prisma).

| Modelo        | Descrição                                                                  |
| ------------- | -------------------------------------------------------------------------- |
| `User`        | Usuário (nome, e-mail único, senha com hash).                              |
| `Assunto`     | Tema/legislação do edital (nome, descrição, ordem).                        |
| `Subassunto`  | Subdivisão de um assunto.                                                  |
| `Questao`     | Enunciado, nível, banca, explicação, base legal, dificuldade, tempo médio. |
| `Alternativa` | Opções de uma questão (texto, `correta`, ordem).                           |
| `Resposta`    | Registro de uma resposta (acertou, tempo gasto, alternativa escolhida).    |
| `Revisao`     | Estado da revisão espaçada por questão/usuário (nível + próxima data).     |
| `Favorito`    | Questões marcadas como favoritas.                                          |
| `Simulado`    | Resumo agregado de um simulado finalizado.                                 |
| `Meta`        | Metas diárias (questões, acerto-alvo, minutos).                            |

As respostas individuais sempre ficam em `Resposta` (e alimentam estatísticas, histórico e
revisão). O `Simulado` guarda apenas o resumo de cada prova para o histórico.

---

## Conteúdo e banco de questões

O banco de conteúdo vive em **`questoes.json`** (na raiz do projeto). Cada questão tem o formato:

```jsonc
{
  "assunto": "Fundamentos do SUAS - Objetivos", // pode vir como "Assunto - Subassunto"
  "nivel": "Médio", // acentuação é normalizada no seed
  "dificuldade": 2, // 1 a 5
  "enunciado": "…",
  "alternativas": [
    { "texto": "…", "correta": true },
    { "texto": "…", "correta": false },
  ],
  "explicacao": "…",
  "fonteLegal": "Lei 8.742/1993, art. 1º",
  "palavrasChave": ["mínimos sociais", "LOAS"],
}
```

No seed, [`prisma/seed-data/from-json.ts`](prisma/seed-data/from-json.ts) processa cada questão:

1. **Normaliza o nível** para `Facil | Medio | Dificil` (sem acento).
2. **Mapeia o assunto** para um dos **assuntos canônicos** do banco e usa o rótulo original como
   **subassunto**, preservando a granularidade para os filtros.
3. **Valida** que cada questão tem ao menos 3 alternativas e exatamente uma correta.

Os assuntos canônicos são: _Fundamentos, PNAS, NOB SUAS, Lei 840, Lei Maria da Penha, PDPM, Plano
DF Social, Cartão Gás, Cartão Prato Cheio, Benefícios Eventuais, Restaurante Comunitário, RIDE,
Lei 7.484/2024 e Lei Orgânica do DF_. A lista de subassuntos é **derivada automaticamente** das
próprias questões em [`prisma/seed-data/index.ts`](prisma/seed-data/index.ts).

Para atualizar o conteúdo, edite `questoes.json` e rode `npm run db:seed`.

---

## Revisão espaçada

Inspirada no Anki. Os intervalos (em dias) estão em
[`src/lib/utils.ts`](src/lib/utils.ts) (`INTERVALOS_REVISAO = [1, 3, 7, 15, 30]`).

A cada resposta, `responder()` faz um _upsert_ na tabela `Revisao`:

- **Acertou** → o nível avança (intervalo maior, até 30 dias).
- **Errou** → o nível volta a 0 (a questão retorna no dia seguinte).

A página `/revisao` lista as questões cuja `proximaData` já chegou. Os flashcards usam a **mesma**
fila: marcar “sabia” avança o intervalo e “não sabia” reinicia. Assim, treino, flashcards e
revisão compartilham um único cronograma de memorização por questão.

---

## Tema claro/escuro

O seletor (`components/theme-toggle.tsx`) alterna a classe `light`/`dark` no `<html>` e persiste a
escolha em `localStorage`. Um script no `layout.tsx` aplica o tema **antes da pintura**, evitando
o flash de tema errado. O modo claro é implementado em
[`src/app/globals.css`](src/app/globals.css) redefinindo a paleta `slate` sob `html.light`, o que
adapta toda a interface sem alterar os componentes.

---

## Autenticação

Auth.js (NextAuth v5) com provedor de **credenciais** e sessão por **JWT**. As senhas são
armazenadas com hash **bcrypt**. As rotas protegidas verificam a sessão no `layout.tsx` do grupo
`(app)/`. A configuração central está em [`src/auth.ts`](src/auth.ts).

O seed cria um usuário inicial (`jadelinda@linda.com`). A senha desse usuário pode ser definida via
`SEED_USER_PASSWORD`; sem essa variável, o padrão de desenvolvimento é `estudar123`. **Troque a
senha em produção.**

---

## Começando

**Pré-requisitos:** Node.js 20+ e npm.

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env          # depois edite o .env (ver tabela abaixo)

# 3. Criar e popular o banco (SQLite, zero setup no dev)
npm run db:push               # cria as tabelas a partir do schema
npm run db:seed               # popula assuntos + questões (lê questoes.json)

# 4. Rodar
npm run dev                   # http://localhost:3000
```

Gere um `AUTH_SECRET` com `npx auth secret`. Após o seed, faça login com `jadelinda@linda.com`
(senha padrão de desenvolvimento `estudar123`, salvo se definida em `SEED_USER_PASSWORD`).

---

## Variáveis de ambiente

| Variável             | Obrigatória | Descrição                                                                 |
| -------------------- | :---------: | ------------------------------------------------------------------------- |
| `DATABASE_URL`       |     sim     | Conexão do banco. Dev: `file:./dev.db`. Prod: string PostgreSQL.          |
| `AUTH_SECRET`        |     sim     | Segredo do Auth.js. Gere com `npx auth secret`.                           |
| `AUTH_TRUST_HOST`    |  recomend.  | `true` fora da Vercel ou atrás de proxy.                                  |
| `SEED_USER_PASSWORD` |     não     | Senha do usuário inicial ao **criar** (banco novo). Padrão: `estudar123`. |

> O `.env` não é versionado. Use o `.env.example` como referência.

---

## Scripts

| Script               | Descrição                                        |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Servidor de desenvolvimento.                     |
| `npm run build`      | Build de produção.                               |
| `npm run start`      | Sobe o build de produção.                        |
| `npm run lint`       | ESLint.                                          |
| `npm run db:push`    | Sincroniza o schema com o banco.                 |
| `npm run db:seed`    | (Re)popula assuntos e questões a partir do JSON. |
| `npm run db:studio`  | Prisma Studio (inspecionar o banco).             |
| `npm run db:migrate` | Aplica migrações (`prisma migrate deploy`).      |
| `npm run db:reset`   | Recria o banco do zero e popula.                 |

---

## Deploy em produção (Vercel + Neon)

App na **Vercel**, banco PostgreSQL no **Neon** (free tier serverless, integra bem com Prisma).

1. **Banco (Neon):** crie um projeto em [neon.tech](https://neon.tech) e copie a connection string
   (`postgresql://…?sslmode=require`).
2. **Schema:** em `prisma/schema.prisma`, troque `provider = "sqlite"` por
   `provider = "postgresql"`.
3. **Carregar o conteúdo** (da sua máquina, com a `DATABASE_URL` do Neon no `.env`):
   ```bash
   npm run db:push      # cria as tabelas no Postgres
   npm run db:seed      # popula assuntos + questões
   ```
4. **Vercel:** importe o repositório e defina as variáveis de ambiente `DATABASE_URL`,
   `AUTH_SECRET` e `AUTH_TRUST_HOST=true`.
5. Faça o deploy. O `postinstall` roda `prisma generate` automaticamente e o `next build` cuida do
   resto.

> O desenvolvimento continua em SQLite (zero setup) — apenas o passo 2 difere entre dev e prod.
> Para ambientes serverless, prefira a connection string **com pooling** do Neon no app.
> Alternativas de banco grátis: **Supabase** ou **Vercel Postgres**.

---

## Reutilizar para outro concurso

Toda a infraestrutura (autenticação, treino, simulado, métricas, revisão espaçada, flashcards e
estudo por legislação) é independente do conteúdo. Para adaptar a outro edital:

1. Substitua o `questoes.json` pelo banco de questões do novo concurso.
2. Ajuste a lista de assuntos canônicos e o mapeamento em `prisma/seed-data/from-json.ts`.
3. Rode `npm run db:reset`.

---
