import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const prisma = new PrismaClient();

type Raw = {
  assunto: string;
  nivel: string;
  dificuldade: number;
  enunciado: string;
  alternativas: { texto: string; correta: boolean }[];
  explicacao: string;
  fonteLegal?: string;
  palavrasChave?: string[];
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

const MAPA: Record<string, string> = {
  "df brincar": "DF Brincar",
  "incentiva df": "Incentiva DF",
  "agentes da cidadania (portaria nº 42/2023)": "Agentes da Cidadania (Portaria nº 42/2023)",
  "agentes de cidadania ambiental": "Agentes de Cidadania Ambiental",
  "df alfabetização": "DF Alfabetização",
  "sos mulher": "SOS Mulher",
};

async function main() {
  const concurso = await prisma.concurso.findFirstOrThrow({ where: { nome: "SEDES-DF" } });

  const existentes = new Set(
    (await prisma.questao.findMany({ select: { enunciado: true } })).map((q) => norm(q.enunciado)),
  );

  const assuntoMap = new Map<string, string>();
  for (const a of await prisma.assunto.findMany({ where: { concursoId: concurso.id } })) {
    assuntoMap.set(a.nome, a.id);
  }

  const raw: Raw[] = JSON.parse(readFileSync(resolve(process.cwd(), "questoes", "questoes_3.json"), "utf8"));

  let criadas = 0;
  let ignoradas = 0;

  for (const q of raw) {
    if (existentes.has(norm(q.enunciado))) {
      ignoradas++;
      continue;
    }

    const chave = norm(q.assunto);
    const nomeAssunto = MAPA[chave] ?? q.assunto;

    const assuntoId = assuntoMap.get(nomeAssunto);
    if (!assuntoId) {
      console.error(`  Assunto não encontrado: "${nomeAssunto}" (raw: "${q.assunto}")`);
      ignoradas++;
      continue;
    }

    // Validação
    if (q.alternativas.length < 3) {
      console.error(`  Questão com poucas alternativas: ${q.enunciado}`);
      ignoradas++;
      continue;
    }
    if (q.alternativas.filter((a) => a.correta).length !== 1) {
      console.error(`  Questão sem exatamente 1 correta: ${q.enunciado}`);
      ignoradas++;
      continue;
    }

    const NIVEL: Record<string, string> = { facil: "Facil", medio: "Medio", dificil: "Dificil" };
    const nivel = NIVEL[norm(q.nivel)] ?? "Medio";

    await prisma.questao.create({
      data: {
        enunciado: q.enunciado,
        nivel,
        banca: "QUADRIX",
        explicacao: q.explicacao,
        fonteLegal: q.fonteLegal,
        dificuldade: q.dificuldade,
        palavrasChave: q.palavrasChave?.join(", "),
        concursoId: concurso.id,
        assuntoId,
        alternativas: {
          create: q.alternativas.map((alt, idx) => ({
            texto: alt.texto,
            correta: alt.correta,
            ordem: idx,
          })),
        },
      },
    });
    criadas++;
  }

  console.log(`Questões criadas: ${criadas}`);
  console.log(`Questões ignoradas: ${ignoradas}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
