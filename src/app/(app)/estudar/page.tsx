import Link from "next/link";
import { auth } from "@/auth";
import { podeAcessarRevisao } from "@/lib/acesso";
import { listarLegislacoes, type LegislacaoResumo } from "@/server/legislacao";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagina, Cabecalho } from "@/components/ui/pagina";
import { BookText, ArrowRight, BellRing, NotebookPen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EstudarPage() {
  const [session, legislacoes] = await Promise.all([auth(), listarLegislacoes()]);
  const podeRevisar = podeAcessarRevisao(session?.user?.email);

  // Agrupa por materia preservando a ordem (a query ja vem ordenada por materia).
  const grupos: { materia: string; itens: LegislacaoResumo[] }[] = [];
  for (const l of legislacoes) {
    let g = grupos.find((x) => x.materia === l.materia);
    if (!g) {
      g = { materia: l.materia, itens: [] };
      grupos.push(g);
    }
    g.itens.push(l);
  }

  return (
    <Pagina className="space-y-8">
      <Cabecalho
        titulo="Estudar por legislação"
        descricao="Os temas estão organizados por matéria. Cada tema reúne o resumo derivado das questões, o material de estudo, o seu próprio resumo e a prática das questões relacionadas."
      />

      {grupos.map((g) => (
        <section key={g.materia} className="space-y-4">
          {/* A matéria é o nome da pasta, não um título de página: vai na
              etiqueta, com a régua fazendo a separação. */}
          <h2 className="etiqueta border-b border-slate-800 pb-2 text-indigo-400">
            {g.materia}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {g.itens.map((l) => {
              const pct = l.totalQuestoes
                ? Math.round((l.respondidas / l.totalQuestoes) * 100)
                : 0;
              return (
                <Link key={l.id} href={`/estudar/${l.id}`} className="group block min-w-0">
                  <Card className="h-full transition-colors group-hover:border-indigo-600/50">
                    <CardContent className="flex h-full flex-col gap-3 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-indigo-500/15 text-indigo-300">
                          <BookText className="h-5 w-5" />
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {/* Marca onde ela ja escreveu o resumo dela: e o que
                              distingue o tema em que ela ja passou de verdade. */}
                          {l.temResumoPessoal && (
                            <Badge
                              variant="success"
                              className="flex items-center gap-1"
                              title="Você escreveu um resumo deste tema"
                            >
                              <NotebookPen className="h-3 w-3" />
                              Resumo
                            </Badge>
                          )}
                          {podeRevisar && l.revisoesPendentes > 0 && (
                            <Badge variant="warning" className="flex items-center gap-1">
                              <BellRing className="h-3 w-3" />
                              {l.revisoesPendentes}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold leading-tight text-slate-100">{l.nome}</h3>
                        {l.descricao && (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-400">{l.descricao}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {l.respondidas}/{l.totalQuestoes} questões · {pct}%
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </Pagina>
  );
}
