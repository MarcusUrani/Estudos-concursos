import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ASSUNTOS, TODAS_QUESTOES } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Limpando questoes e progresso...");
  await prisma.resposta.deleteMany();
  await prisma.revisao.deleteMany();
  await prisma.favorito.deleteMany();
  await prisma.alternativa.deleteMany();
  await prisma.questao.deleteMany();
  await prisma.subassunto.deleteMany();
  await prisma.assunto.deleteMany();
  await prisma.meta.deleteMany();

  // Usuario inicial: upsert por e-mail mantem o MESMO id entre re-seeds,
  // evitando que sessoes (cookies) ja logadas fiquem invalidas.
  // A senha SO e definida na criacao (ou via SEED_USER_PASSWORD). Em re-seeds
  // que mantem o usuario, a senha atual e preservada (nao revertida).
  const senhaPadrao = process.env.SEED_USER_PASSWORD ?? "estudar123";
  const senhaHash = await bcrypt.hash(senhaPadrao, 10);
  await prisma.user.upsert({
    where: { email: "jadelinda@linda.com" },
    update: { nome: "Jadelinda" },
    create: { nome: "Jadelinda", email: "jadelinda@linda.com", senha: senhaHash },
  });
  console.log("Usuario garantido: jadelinda@linda.com");

  // Assuntos + subassuntos
  const assuntoMap = new Map<string, string>();
  const subassuntoMap = new Map<string, string>();
  for (let i = 0; i < ASSUNTOS.length; i++) {
    const a = ASSUNTOS[i];
    const assunto = await prisma.assunto.create({
      data: { nome: a.nome, descricao: a.descricao, ordem: i },
    });
    assuntoMap.set(a.nome, assunto.id);
    for (const sub of a.subassuntos) {
      const s = await prisma.subassunto.create({
        data: { nome: sub, assuntoId: assunto.id },
      });
      subassuntoMap.set(`${a.nome}::${sub}`, s.id);
    }
  }
  console.log(`Assuntos criados: ${assuntoMap.size}`);

  // Questoes
  let criadas = 0;
  const porAssunto = new Map<string, number>();
  for (const q of TODAS_QUESTOES) {
    const assuntoId = assuntoMap.get(q.assunto);
    if (!assuntoId) throw new Error(`Assunto nao encontrado: ${q.assunto}`);
    const subassuntoId = q.subassunto
      ? subassuntoMap.get(`${q.assunto}::${q.subassunto}`)
      : undefined;

    if (q.subassunto && !subassuntoId) {
      throw new Error(`Subassunto nao encontrado: ${q.assunto} :: ${q.subassunto}`);
    }

    // Garante que a questao seja de multipla escolha e tenha exatamente uma correta.
    const corretas = q.alternativas.filter((a) => a.correta).length;
    if (q.alternativas.length < 3) {
      throw new Error(`Questao com poucas alternativas (multipla escolha): ${q.enunciado}`);
    }
    if (corretas !== 1) {
      throw new Error(`Questao deve ter exatamente 1 alternativa correta: ${q.enunciado}`);
    }

    await prisma.questao.create({
      data: {
        enunciado: q.enunciado,
        nivel: q.nivel,
        banca: "QUADRIX",
        explicacao: q.explicacao,
        fonteLegal: q.fonteLegal,
        dificuldade: q.dificuldade,
        palavrasChave: q.palavrasChave?.join(", "),
        assuntoId,
        subassuntoId,
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
    porAssunto.set(q.assunto, (porAssunto.get(q.assunto) ?? 0) + 1);
  }

  console.log(`Questoes criadas: ${criadas}`);
  for (const [assunto, total] of porAssunto) {
    console.log(`  - ${assunto}: ${total}`);
  }
  console.log("Seed concluido com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
