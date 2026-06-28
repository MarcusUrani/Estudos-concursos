# Estuda SEDES-DF — notas para o agente

Plataforma de estudos (estilo QConcursos) focada no concurso SEDES-DF, questões QUADRIX.
Projetada para ser reutilizável em outros concursos trocando só o conteúdo (seed/banco).

## Stack

Next.js 16 (App Router, full-stack) · React 19 · Tailwind v4 · Prisma 6 + SQLite (dev) /
PostgreSQL (prod) · Auth.js v5 (credenciais, JWT) · React Query · Framer Motion.

## Convenções

- **UI**: `src/app/` (rotas) e `src/components/` (`ui/` = design system próprio estilo shadcn,
  classes Tailwind concretas paleta slate/indigo — NÃO depende de CSS vars do shadcn).
- **Regras de negócio**: `src/server/*` (server actions com `"use server"` e queries). Manter
  acesso a dados aqui para facilitar extrair um NestJS depois.
- **Dados**: `src/lib/prisma.ts` (singleton). Schema em `prisma/schema.prisma`.
- Rotas protegidas ficam no grupo `src/app/(app)/` — o `layout.tsx` faz o guard com `auth()`.
- Arquivos `"use server"` só podem exportar funções async (tipos são OK).
- SQLite não tem arrays/enums: `palavrasChave` é CSV; `nivel` é string ("Facil|Medio|Dificil").

## Comandos

`npm run dev` · `npm run build` · `npm run db:push` · `npm run db:seed` · `npm run db:reset`
Login demo: ana@sedes.df / estudar123

## Revisão espaçada

Intervalos em `src/lib/utils.ts` (`INTERVALOS_REVISAO` = [1,3,7,15,30] dias). `responder()` em
`src/server/treino.ts` faz upsert da `Revisao`: acerto avança nível, erro volta a 0.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Objetivo do projeto

Uma plataforma de estudos focada exclusivamente no concurso da SEDES-DF, utilizando questões no estilo QUADRIX, acompanhamento de desempenho e revisão inteligente.

Algo parecido com o QConcursos, porém extremamente focado no edital dela.

---

# Stack

Como você já trabalha com JavaScript, HTML, React e Node, eu manteria tudo no ecossistema que você domina.

## Front-end

- React
- Next.js
- TailwindCSS
- shadcn/ui
- React Query (TanStack)
- Framer Motion

---

## Backend

- Node.js
- NestJS (ou Express se quiser simplicidade)
- Prisma ORM

---

## Banco

PostgreSQL

Tabelas pequenas, consultas rápidas e ótimo suporte ao Prisma.

---

## Autenticação

NextAuth ou JWT.

No começo pode até existir somente um usuário (sua esposa).

---

## Hospedagem

Frontend

- Vercel

Backend

- Railway
- Render
- VPS

Banco

- Neon
- Supabase

Tudo praticamente gratuito.

---

# Funcionalidades

## Dashboard

Ao entrar ela verá algo como

```
Olá, Ana 👋

Questões respondidas:
534

Acertos:
82%

Tempo estudando:
21 horas

Temas dominados:
✅ SUAS
✅ PNAS

Temas fracos:
⚠ Lei 840
⚠ Cartão Prato Cheio

Continue de onde parou
```

---

# Banco de questões

Cada questão terá:

```ts
id

titulo

tema

subtema

nivel

banca

enunciado

alternativas[]

respostaCorreta

explicacao

fonteLegal

palavrasChave[]

dificuldade

tempoMedio

```

Exemplo:

```json
{
  "tema": "SUAS",
  "subtema": "Segurança de acolhida",
  "banca": "QUADRIX",
  "nivel": "Médio",
  "explicacao": "A segurança de acolhida consiste..."
}
```

---

# Filtros

Ela poderá montar simulados.

Por exemplo:

```
✓ Apenas QUADRIX

✓ Apenas Lei 840

✓ Apenas SUAS

✓ Questões erradas

✓ Questões nunca respondidas

✓ Questões favoritas

✓ Dificuldade difícil

✓ 20 questões

```

---

# Modo treino

Ela responde.

Depois aparece

```
✔ Correta

Comentário

Trecho da lei

Artigo relacionado

```

---

# Estatísticas

Por tema

```
SUAS

██████████ 95%

Lei 840

██████░░░░ 61%

Maria da Penha

████████░░ 82%

PDPM

█████░░░░░ 52%
```

---

# Revisão inteligente

Se errar:

```
Questão 53

↓

entra numa fila de revisão

↓

1 dia

↓

3 dias

↓

7 dias

↓

15 dias

↓

30 dias
```

Basicamente um Anki.

---

# Questões favoritas

⭐ Favoritar

para revisar depois.

---

# Questões comentadas

Após responder:

```
Alternativa correta

Por que está correta

Por que as demais estão erradas

Artigo da lei

Link da legislação
```

---

# Simulado

Cronometrado

```
50 questões

2 horas

Resultado final

Ranking pessoal

```

---

# Histórico

```
01/07

40 questões

90%

--------------------------------

03/07

20 questões

75%

--------------------------------

05/07

100 questões

82%

```

---

# Metas

```
Hoje

✓ Resolver 30 questões

✓ Acertar acima de 80%

✓ Estudar 1 hora

```

---

# Gamificação

Muito útil.

Por exemplo:

🏆

```
7 dias estudando

100 questões seguidas

90% em SUAS

Lei 840 Master

Especialista em PNAS
```

---

# Estrutura do banco

## users

```
id

nome

email

senha
```

---

## assuntos

```
id

nome

descricao
```

---

## subassuntos

```
id

assunto_id

nome
```

---

## questoes

```
id

assunto

subassunto

enunciado

nivel

explicacao

fonte

```

---

## alternativas

```
id

questao

texto

correta
```

---

## respostas

```
id

usuario

questao

acertou

tempo

respondidaEm
```

---

## revisoes

```
id

usuario

questao

proximaData

nivel
```

---

## favoritos

```
usuario

questao
```

---

# Organização das questões

```
Fundamentos

    História da assistência

    LOAS

    SUAS

    PNAS

---------------------------------

PNAS

    princípios

    objetivos

    matricialidade

    territorialização

    PSB

    PSE

---------------------------------

NOB SUAS

    gestão

    financiamento

    vigilância

---------------------------------

Lei 840

---------------------------------

Lei Maria da Penha

---------------------------------

PDPM

---------------------------------

Plano DF Social

---------------------------------

Cartão Gás

---------------------------------

Cartão Prato Cheio

---------------------------------

Benefícios Eventuais

---------------------------------

Restaurante Comunitário

---------------------------------

RIDE

```

---

# Como gerar as questões

Aqui está a parte mais interessante.

Você pode usar IA para criar um banco enorme.

Fluxo:

```
Lei

↓

Quebrar em artigos

↓

Enviar para IA

↓

Gerar questões QUADRIX

↓

Gerar explicação

↓

Salvar no banco
```

Exemplo:

```
Art. 6º...

↓

Crie 10 questões no estilo QUADRIX.

Não copie questões existentes.

Faça alternativas plausíveis.

Informe o artigo.

Explique o motivo.

```

Com isso você consegue facilmente:

- 100 questões da Lei 840
- 300 do SUAS
- 200 da PNAS
- 150 da Maria da Penha

No total, um banco de 1.000–2.000 questões inéditas e consistentes, desde que você revise a qualidade antes de disponibilizá-las.

---

# Funcionalidade que faria muita diferença

Eu incluiria um **modo de estudo por legislação**, que integra leitura e prática em uma única tela.

```
Lei

↓

Capítulo

↓

Resumo

↓

Mapa mental

↓

Questões daquele trecho

↓

Flashcards

↓

Revisão espaçada
```

Por exemplo:

```
Lei 840

↓

Título VI

↓

Resumo

↓

10 questões

↓

Flashcards

↓

Revisão amanhã
```

Isso faz com que ela não apenas memorize respostas, mas compreenda a estrutura da legislação.

---

# Roadmap de desenvolvimento

Eu dividiria o projeto em cinco fases para manter a entrega organizada:

1. **MVP (1–2 semanas):**
   - Login
   - Banco de questões
   - Resolução de questões
   - Correção imediata
   - Explicações
   - Filtro por tema

2. **Fase 2:**
   - Estatísticas por assunto
   - Histórico de estudos
   - Favoritos
   - Questões erradas

3. **Fase 3:**
   - Simulados cronometrados
   - Dashboard completo

4. **Fase 4:**
   - Revisão espaçada
   - Flashcards automáticos
   - Resumos por legislação
   - Modo de leitura da lei com questões relacionadas

5. **Fase 5:**
   - Geração assistida de novas questões por IA
   - Painel administrativo para cadastrar e revisar questões
   - Importação de legislação e atualização do banco quando houver alterações normativas

Esse projeto tem potencial para ser muito mais do que uma ferramenta de estudo pessoal. Com uma boa arquitetura desde o início, você poderá reutilizar a mesma base para criar plataformas voltadas a outros concursos (TJDFT, PCDF, CLDF, INSS, CNU etc.), alterando apenas o banco de conteúdos e questões. A estrutura de autenticação, simulados, métricas, revisão espaçada e painel administrativo permanece praticamente a mesma, tornando o sistema escalável e reutilizável para diferentes editais.
