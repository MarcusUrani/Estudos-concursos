import { PrismaClient } from "@prisma/client";
import questoes, { ASSUNTOS_BASE } from "./seed-data/from-json";

const prisma = new PrismaClient();

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

async function main() {
  const concurso = await prisma.concurso.findFirstOrThrow({ where: { nome: "SEDES-DF" } });

  const existentes = new Set(
    (await prisma.questao.findMany({ select: { enunciado: true } })).map((q) => norm(q.enunciado)),
  );

  const assuntoMap = new Map<string, string>();
  for (const a of await prisma.assunto.findMany({ where: { concursoId: concurso.id } })) {
    assuntoMap.set(a.nome, a.id);
  }

  const materiaMap = new Map<string, string>();
  for (const m of await prisma.materia.findMany({ where: { concursoId: concurso.id } })) {
    materiaMap.set(m.nome, m.id);
  }

  let criadas = 0;
  let ignoradas = 0;

  for (const raw of questoes) {
    if (existentes.has(norm(raw.enunciado))) {
      ignoradas++;
      continue;
    }

    // Garante que o assunto canônico existe
    if (!assuntoMap.has(raw.assunto)) {
      const base = ASSUNTOS_BASE.find((a) => a.nome === raw.assunto);
      if (!base) throw new Error(`Assunto "${raw.assunto}" não encontrado em ASSUNTOS_BASE`);

      const materiaId = materiaMap.get(base.materia);
      if (!materiaId) throw new Error(`Matéria "${base.materia}" não encontrada`);

      const assunto = await prisma.assunto.create({
        data: {
          nome: raw.assunto,
          descricao: base.descricao,
          ordem: await prisma.assunto.count({ where: { concursoId: concurso.id } }),
          materiaId,
          concursoId: concurso.id,
        },
      });
      assuntoMap.set(raw.assunto, assunto.id);
      console.log(`  Assunto criado: ${raw.assunto}`);
    }

    const assuntoId = assuntoMap.get(raw.assunto)!;

    // Cria subassunto se necessário
    let subassuntoId: string | undefined;
    if (raw.subassunto) {
      const key = `${raw.assunto}::${raw.subassunto}`;
      const existing = await prisma.subassunto.findFirst({
        where: { nome: raw.subassunto, assuntoId },
      });
      if (existing) {
        subassuntoId = existing.id;
      } else {
        const s = await prisma.subassunto.create({
          data: { nome: raw.subassunto, assuntoId },
        });
        subassuntoId = s.id;
      }
    }

    await prisma.questao.create({
      data: {
        enunciado: raw.enunciado,
        nivel: raw.nivel,
        banca: "QUADRIX",
        explicacao: raw.explicacao,
        fonteLegal: raw.fonteLegal,
        dificuldade: raw.dificuldade,
        palavrasChave: raw.palavrasChave?.join(", "),
        concursoId: concurso.id,
        assuntoId,
        subassuntoId,
        alternativas: {
          create: raw.alternativas.map((alt, idx) => ({
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
  console.log(`Questões ignoradas (já existentes): ${ignoradas}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
