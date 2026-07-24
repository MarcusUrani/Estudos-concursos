"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  criarMateria,
  criarAssunto,
  criarQuestao,
  importarQuestoes,
  getResumoEstudo,
  salvarResumoEstudo,
  type ConteudoAdmin,
  type ResultadoImport,
} from "@/server/admin-conteudo";
import { NIVEIS, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertCircle, Plus, Trash2, Save, Upload } from "lucide-react";

const inputCls =
  "w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
const textareaCls = cn(inputCls, "resize-y");

type Aba = "materia" | "assunto" | "questao" | "estudo";

const ABAS: { id: Aba; label: string }[] = [
  { id: "materia", label: "Matéria" },
  { id: "assunto", label: "Assunto" },
  { id: "questao", label: "Questões" },
  { id: "estudo", label: "Estudo" },
];

export function ConteudoClient({ conteudo }: { conteudo: ConteudoAdmin }) {
  const [aba, setAba] = useState<Aba>("materia");

  return (
    <div className="space-y-5">
      <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-950/40 p-1">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAba(a.id)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              aba === a.id
                ? "bg-indigo-600/20 text-indigo-200 ring-1 ring-inset ring-indigo-500/40"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === "materia" && <MateriaForm />}
      {aba === "assunto" && <AssuntoForm materias={conteudo.materias} />}
      {aba === "questao" && <QuestaoForm assuntos={conteudo.assuntos} />}
      {aba === "estudo" && <EstudoForm assuntos={conteudo.assuntos} />}
    </div>
  );
}

// -------------------------------------------------------------- feedback

function Feedback({ erro, ok }: { erro?: string | null; ok?: string | null }) {
  if (!erro && !ok) return null;
  return erro ? (
    <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="whitespace-pre-wrap">{erro}</span>
    </div>
  ) : (
    <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="whitespace-pre-wrap">{ok}</span>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-300">{label}</p>
      {children}
    </div>
  );
}

// -------------------------------------------------------------- matéria

function MateriaForm() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function salvar() {
    setErro(null);
    setOk(null);
    start(async () => {
      try {
        await criarMateria({ nome, descricao });
        setOk(`Matéria "${nome.trim()}" criada.`);
        setNome("");
        setDescricao("");
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível criar a matéria.");
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <Campo label="Nome da matéria">
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Legislação Social do DF" />
        </Campo>
        <Campo label="Descrição (opcional)">
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} className={textareaCls} />
        </Campo>
        <Feedback erro={erro} ok={ok} />
        <div className="flex justify-end">
          <Button onClick={salvar} disabled={pending || !nome.trim()}>
            <Plus className="h-4 w-4" />
            {pending ? "Criando…" : "Criar matéria"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------------- assunto

function AssuntoForm({ materias }: { materias: ConteudoAdmin["materias"] }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [materiaId, setMateriaId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function salvar() {
    setErro(null);
    setOk(null);
    start(async () => {
      try {
        await criarAssunto({ nome, descricao, materiaId });
        setOk(`Assunto "${nome.trim()}" criado.`);
        setNome("");
        setDescricao("");
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível criar o assunto.");
      }
    });
  }

  if (materias.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-slate-400">
          Crie uma <span className="font-medium text-slate-200">matéria</span> primeiro — todo assunto pertence a uma
          matéria.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <Campo label="Matéria">
          <select value={materiaId} onChange={(e) => setMateriaId(e.target.value)} className={inputCls}>
            <option value="">Selecione…</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Nome do assunto">
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Lei nº 840/2011 (Servidores)" />
        </Campo>
        <Campo label="Descrição (opcional)">
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} className={textareaCls} />
        </Campo>
        <Feedback erro={erro} ok={ok} />
        <div className="flex justify-end">
          <Button onClick={salvar} disabled={pending || !nome.trim() || !materiaId}>
            <Plus className="h-4 w-4" />
            {pending ? "Criando…" : "Criar assunto"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------------- questões

function QuestaoForm({ assuntos }: { assuntos: ConteudoAdmin["assuntos"] }) {
  const [modo, setModo] = useState<"uma" | "lote">("uma");

  if (assuntos.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-slate-400">
          Crie uma <span className="font-medium text-slate-200">matéria</span> e um{" "}
          <span className="font-medium text-slate-200">assunto</span> antes de cadastrar questões.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["uma", "lote"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setModo(m)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              modo === m
                ? "border-indigo-500 bg-indigo-600/15 text-indigo-200"
                : "border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-600"
            )}
          >
            {m === "uma" ? "Uma questão" : "Em lote (JSON)"}
          </button>
        ))}
      </div>

      {modo === "uma" ? <QuestaoUnica assuntos={assuntos} /> : <QuestaoLote assuntos={assuntos} />}
    </div>
  );
}

type AltState = { texto: string; correta: boolean };

function QuestaoUnica({ assuntos }: { assuntos: ConteudoAdmin["assuntos"] }) {
  const router = useRouter();
  const [assuntoId, setAssuntoId] = useState("");
  const [subassunto, setSubassunto] = useState("");
  const [enunciado, setEnunciado] = useState("");
  const [nivel, setNivel] = useState<string>("Medio");
  const [dificuldade, setDificuldade] = useState(3);
  const [fonteLegal, setFonteLegal] = useState("");
  const [palavrasChave, setPalavrasChave] = useState("");
  const [explicacao, setExplicacao] = useState("");
  const [alternativas, setAlternativas] = useState<AltState[]>([
    { texto: "", correta: true },
    { texto: "", correta: false },
  ]);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function setAlt(i: number, texto: string) {
    setAlternativas((prev) => prev.map((a, idx) => (idx === i ? { ...a, texto } : a)));
  }
  function marcar(i: number) {
    setAlternativas((prev) => prev.map((a, idx) => ({ ...a, correta: idx === i })));
  }
  function addAlt() {
    setAlternativas((prev) => (prev.length >= 8 ? prev : [...prev, { texto: "", correta: false }]));
  }
  function removeAlt(i: number) {
    setAlternativas((prev) => {
      if (prev.length <= 2) return prev;
      const nova = prev.filter((_, idx) => idx !== i);
      if (!nova.some((a) => a.correta)) nova[0].correta = true;
      return nova;
    });
  }
  function certoErrado() {
    setAlternativas([
      { texto: "Certo", correta: true },
      { texto: "Errado", correta: false },
    ]);
  }

  function salvar() {
    setErro(null);
    setOk(null);
    start(async () => {
      try {
        await criarQuestao({
          assuntoId,
          subassunto,
          enunciado,
          nivel,
          dificuldade,
          fonteLegal,
          palavrasChave,
          explicacao,
          alternativas,
        });
        setOk("Questão criada com sucesso.");
        setEnunciado("");
        setSubassunto("");
        setFonteLegal("");
        setPalavrasChave("");
        setExplicacao("");
        setAlternativas([
          { texto: "", correta: true },
          { texto: "", correta: false },
        ]);
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível criar a questão.");
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <Campo label="Assunto">
          <select value={assuntoId} onChange={(e) => setAssuntoId(e.target.value)} className={inputCls}>
            <option value="">Selecione…</option>
            {assuntos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.materia ? `${a.materia} — ${a.nome}` : a.nome}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Subassunto (opcional)">
          <Input value={subassunto} onChange={(e) => setSubassunto(e.target.value)} placeholder="Ex.: Licenças" />
        </Campo>

        <Campo label="Enunciado">
          <textarea value={enunciado} onChange={(e) => setEnunciado(e.target.value)} rows={4} className={textareaCls} />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nível">
            <div className="flex flex-wrap gap-2">
              {NIVEIS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNivel(n)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    nivel === n
                      ? "border-indigo-500 bg-indigo-600/15 text-indigo-200"
                      : "border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-600"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </Campo>
          <Campo label={`Dificuldade: ${dificuldade}`}>
            <input
              type="range"
              min={1}
              max={5}
              value={dificuldade}
              onChange={(e) => setDificuldade(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </Campo>
        </div>

        <Campo label="Alternativas (marque a correta)">
          <div className="space-y-2">
            {alternativas.map((a, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2 rounded-xl border p-2.5",
                  a.correta ? "border-emerald-500/60 bg-emerald-500/5" : "border-slate-700 bg-slate-950/40"
                )}
              >
                <button
                  type="button"
                  onClick={() => marcar(i)}
                  title="Marcar como correta"
                  className={cn(
                    "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors",
                    a.correta
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-600 text-slate-500 hover:border-slate-400"
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </button>
                <textarea
                  value={a.texto}
                  onChange={(e) => setAlt(i, e.target.value)}
                  rows={1}
                  className={cn(textareaCls, "min-h-0")}
                  placeholder={`Alternativa ${String.fromCharCode(65 + i)}`}
                />
                {alternativas.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeAlt(i)}
                    title="Remover alternativa"
                    className="mt-1 text-slate-500 transition-colors hover:text-rose-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" size="sm" onClick={addAlt} disabled={alternativas.length >= 8}>
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
            <Button variant="ghost" size="sm" onClick={certoErrado}>
              Certo / Errado
            </Button>
          </div>
        </Campo>

        <Campo label="Comentário / explicação">
          <textarea value={explicacao} onChange={(e) => setExplicacao(e.target.value)} rows={3} className={textareaCls} />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Base legal (opcional)">
            <Input value={fonteLegal} onChange={(e) => setFonteLegal(e.target.value)} placeholder="Ex.: Art. 3º da Lei..." />
          </Campo>
          <Campo label="Palavras-chave (opcional, separadas por vírgula)">
            <Input value={palavrasChave} onChange={(e) => setPalavrasChave(e.target.value)} placeholder="suas, pnas" />
          </Campo>
        </div>

        <Feedback erro={erro} ok={ok} />
        <div className="flex justify-end">
          <Button onClick={salvar} disabled={pending || !assuntoId}>
            <Save className="h-4 w-4" />
            {pending ? "Salvando…" : "Criar questão"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------------- material de estudo

function EstudoForm({ assuntos }: { assuntos: ConteudoAdmin["assuntos"] }) {
  const [assuntoId, setAssuntoId] = useState("");
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [carregando, startLoad] = useTransition();
  const [pending, startSave] = useTransition();

  function selecionar(id: string) {
    setAssuntoId(id);
    setErro(null);
    setOk(null);
    setTexto("");
    if (!id) return;
    startLoad(async () => {
      try {
        setTexto(await getResumoEstudo(id));
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível carregar o material.");
      }
    });
  }

  function salvar() {
    setErro(null);
    setOk(null);
    startSave(async () => {
      try {
        await salvarResumoEstudo(assuntoId, texto);
        setOk("Material de estudo salvo.");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
      }
    });
  }

  if (assuntos.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-slate-400">
          Crie uma <span className="font-medium text-slate-200">matéria</span> e um{" "}
          <span className="font-medium text-slate-200">assunto</span> antes de escrever o material de estudo.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400">
          O material aparece no topo da aba <span className="font-medium text-slate-200">Resumo</span> da tela
          Estudar, acima do resumo automático das questões. As quebras de linha são preservadas — escreva em
          tópicos, seções, etc. Deixe em branco para remover.
        </div>

        <Campo label="Assunto">
          <select value={assuntoId} onChange={(e) => selecionar(e.target.value)} className={inputCls}>
            <option value="">Selecione…</option>
            {assuntos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.materia ? `${a.materia} — ${a.nome}` : a.nome}
              </option>
            ))}
          </select>
        </Campo>

        {assuntoId && (
          <Campo label="Material de estudo">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={14}
              disabled={carregando}
              className={cn(textareaCls, carregando && "opacity-50")}
              placeholder={carregando ? "Carregando…" : "Escreva o resumo / material de estudo deste assunto…"}
            />
          </Campo>
        )}

        <Feedback erro={erro} ok={ok} />

        {assuntoId && (
          <div className="flex justify-end">
            <Button onClick={salvar} disabled={pending || carregando}>
              <Save className="h-4 w-4" />
              {pending ? "Salvando…" : "Salvar material"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuestaoLote({ assuntos }: { assuntos: ConteudoAdmin["assuntos"] }) {
  const router = useRouter();
  const [json, setJson] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoImport | null>(null);
  const [pending, start] = useTransition();

  function exemplo() {
    const assunto = assuntos[0]?.nome ?? "Nome do assunto";
    setJson(
      JSON.stringify(
        [
          {
            assunto,
            subassunto: null,
            enunciado: "Segundo a legislação, o benefício X é concedido a...",
            nivel: "Medio",
            explicacao: "A alternativa correta reflete o disposto no artigo...",
            fonteLegal: "Art. 1º da Lei nº 0.000/0000",
            dificuldade: 3,
            palavrasChave: ["exemplo", "modelo"],
            alternativas: [
              { texto: "Certo", correta: true },
              { texto: "Errado", correta: false },
            ],
          },
        ],
        null,
        2
      )
    );
  }

  function importar() {
    setErro(null);
    setResultado(null);
    start(async () => {
      try {
        const r = await importarQuestoes(json);
        setResultado(r);
        if (r.criadas > 0) router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível importar.");
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400">
          Cole um <span className="font-medium text-slate-200">array JSON</span> de questões. Cada item usa o{" "}
          <span className="font-medium text-slate-200">nome do assunto</span> (deve já existir). Questões com enunciado
          repetido são ignoradas. Campos: <code className="text-indigo-300">assunto, enunciado, explicacao,
          alternativas[]</code> (obrigatórios); <code className="text-indigo-300">subassunto, nivel, banca, fonteLegal,
          dificuldade, palavrasChave[]</code> (opcionais). Cada questão precisa de exatamente uma alternativa com{" "}
          <code className="text-indigo-300">correta: true</code>.
        </div>

        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          rows={14}
          spellCheck={false}
          className={cn(textareaCls, "font-mono text-xs")}
          placeholder='[ { "assunto": "...", "enunciado": "...", "explicacao": "...", "alternativas": [ { "texto": "Certo", "correta": true }, { "texto": "Errado", "correta": false } ] } ]'
        />

        {erro && <Feedback erro={erro} />}
        {resultado && (
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm">
            <p className="text-emerald-300">
              {resultado.criadas} {resultado.criadas === 1 ? "questão criada" : "questões criadas"}
              {resultado.ignoradas > 0 && (
                <span className="text-slate-400"> · {resultado.ignoradas} ignorada(s) (duplicadas)</span>
              )}
            </p>
            {resultado.erros.length > 0 && (
              <div className="space-y-1 text-rose-300">
                <p className="font-medium">Itens com problema ({resultado.erros.length}):</p>
                <ul className="list-inside list-disc space-y-0.5 text-xs">
                  {resultado.erros.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={exemplo}>
            Inserir exemplo
          </Button>
          <Button onClick={importar} disabled={pending || !json.trim()}>
            <Upload className="h-4 w-4" />
            {pending ? "Importando…" : "Importar questões"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
