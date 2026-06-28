# Estuda SEDES-DF

Plataforma de estudos focada no concurso da **SEDES-DF**, com questões no estilo **QUADRIX**,
acompanhamento de desempenho e revisão inteligente (estilo Anki). Arquitetada para ser
**reutilizável** em outros concursos (TJDFT, PCDF, INSS, CNU…) — basta trocar o banco de conteúdo.

## Stack

- **Next.js 16** (App Router) — front-end **e** back-end no mesmo projeto
- **React 19** + **TailwindCSS v4** + componentes próprios estilo shadcn/ui
- **Framer Motion** (animações) · **TanStack React Query** (cliente)
- **Prisma ORM** + **SQLite** (dev) → **PostgreSQL** (produção)
- **Auth.js (NextAuth v5)** — autenticação por credenciais (JWT)

## Arquitetura de pastas

```
estudos_concursos/
├─ prisma/
│  ├─ schema.prisma        # modelos do banco
│  ├─ seed.ts              # assuntos do edital + questões de exemplo
│  └─ dev.db               # SQLite (gerado, não versionado)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx        # layout raiz (Providers, fontes, tema)
│  │  ├─ page.tsx          # redireciona p/ /dashboard ou /login
│  │  ├─ globals.css       # tema (dark) Tailwind v4
│  │  ├─ login/            # tela de login (server action + form)
│  │  ├─ (app)/            # grupo de rotas PROTEGIDAS (exige sessão)
│  │  │  ├─ layout.tsx     # guard de auth + navegação
│  │  │  ├─ dashboard/     # painel com estatísticas
│  │  │  └─ treino/        # modo treino (filtros + resolução)
│  │  └─ api/auth/[...nextauth]/  # rotas do Auth.js
│  ├─ auth.ts              # config central do Auth.js
│  ├─ components/
│  │  ├─ ui/               # Button, Card, Input, Badge, Progress... (design system)
│  │  ├─ nav.tsx           # navegação lateral
│  │  └─ providers.tsx     # SessionProvider + React Query
│  ├─ lib/
│  │  ├─ prisma.ts         # singleton do Prisma Client
│  │  └─ utils.ts          # helpers (cn, formatação, intervalos de revisão)
│  ├─ server/              # lógica de servidor (server actions / queries)
│  │  ├─ treino.ts         # montarTreino, responder, favoritar (+ revisão espaçada)
│  │  ├─ stats.ts          # estatísticas do dashboard
│  │  └─ auth-actions.ts   # logout
│  └─ types/               # augmentations de tipos (next-auth)
```

**Princípio:** UI em `app/` e `components/`, regras de negócio em `server/`, acesso a dados via
`lib/prisma.ts`. Para extrair um back-end NestJS no futuro, basta migrar `src/server/*`.

## Como rodar

```bash
npm install
npm run db:push     # cria o banco SQLite a partir do schema
npm run db:seed     # popula assuntos do edital + questões de exemplo
npm run dev         # http://localhost:3000
```

**Login de demonstração:** `ana@sedes.df` / `estudar123`

### Scripts úteis

| Script             | Descrição                                        |
| ------------------ | ------------------------------------------------ |
| `npm run dev`      | servidor de desenvolvimento                      |
| `npm run build`    | build de produção                                |
| `npm run db:studio`| Prisma Studio (inspecionar o banco)              |
| `npm run db:seed`  | (re)popular dados de exemplo                      |
| `npm run db:reset` | recriar o banco do zero e popular                |

## MVP entregue (Fase 1)

- [x] Login (Auth.js, credenciais)
- [x] Banco de questões (schema completo + seed)
- [x] Resolução de questões com correção imediata
- [x] Explicação + base legal por questão
- [x] Filtros (tema, nível, situação, quantidade) para montar treinos
- [x] Dashboard com estatísticas (acertos, tempo, desempenho por tema, temas fortes/fracos)
- [x] Base para revisão espaçada e favoritos (já gravados ao responder)

## Deploy em produção (Vercel + Neon)

App na **Vercel**, banco PostgreSQL no **Neon** (free tier serverless, casa bem com Prisma).

1. **Banco (Neon):** crie um projeto em [neon.tech](https://neon.tech) e copie a connection
   string (`postgresql://...?sslmode=require`).
2. **Schema:** em `prisma/schema.prisma`, troque `provider = "sqlite"` por
   `provider = "postgresql"`.
3. **Carregar o conteúdo** (a partir da sua máquina, com a `DATABASE_URL` do Neon no `.env`):
   ```bash
   npm run db:push      # cria as tabelas no Postgres
   npm run db:seed      # popula assuntos + questões (lê questoes.json)
   ```
4. **Vercel:** importe o repositório e defina as variáveis de ambiente:
   - `DATABASE_URL` → a string do Neon
   - `AUTH_SECRET` → gere com `npx auth secret`
   - `AUTH_TRUST_HOST` → `true`
5. Deploy. O `postinstall` roda `prisma generate` automaticamente; o `next build` faz o resto.

> Dev continua em SQLite (zero setup) — só o passo 2 difere entre dev e prod. Alternativas de
> banco grátis: **Supabase** (pausa após inatividade) ou **Vercel Postgres** (Neon por baixo).

## Fase 2 entregue

- [x] Página de favoritas (`/favoritas`) e de questões que errei (`/erradas`),
      com modos **Responder** (padrão) e **Visualizar**.
- [x] Histórico detalhado (`/historico`): todas as respostas, agrupadas por dia,
      com filtros por resultado (acertos/erros) e por tema.

## Fase 3 entregue

- [x] Simulados cronometrados (`/simulado`): filtros + tempo limite, relógio
      regressivo com auto-envio, mapa de questões, correção só no final com
      gabarito comentado e desempenho por tema. Resumo gravado em `Simulado`
      (as respostas individuais continuam alimentando stats/histórico/revisão).
- [x] Gamificação (`/conquistas`): XP, níveis, sequência de dias (streak) e
      medalhas, tudo derivado da atividade. Widget de nível/streak no dashboard.
- _Metas diárias removidas do escopo (não necessárias)._

## Fase 4 entregue

- [x] **Revisão espaçada** (`/revisao`): fila estilo Anki com as questões vencidas
      (`proximaData <= hoje`); responder reagenda automaticamente (1→3→7→15→30 dias).
      CTA no dashboard quando há pendências.
- [x] **Flashcards automáticos** (`/flashcards`): cards gerados das próprias questões
      (frente = enunciado, verso = correta + comentário + base legal). A auto-avaliação
      “sabia / não sabia” alimenta a **mesma** fila de revisão espaçada. Filtro por assunto,
      quantidade e “apenas vencidos”.
- [x] **Resumos por legislação** (`/estudar`): cada tema vira uma legislação com resumo
      **derivado das explicações das questões** (agrupado por subassunto + bases legais).
- [x] **Modo de leitura da lei com questões relacionadas** (`/estudar/[assunto]`): aba
      **Resumo** (pontos-chave + fontes legais) e aba **Praticar** (questões do tema inline),
      além de atalho para os flashcards do tema.
- _Sem mudança de schema: revisão e flashcards reusam o modelo `Revisao`; os resumos são
  derivados ao vivo das questões._

## Próximas fases

- **Fase 5:** geração de questões assistida por IA + painel administrativo.
