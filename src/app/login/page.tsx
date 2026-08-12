import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { MarcaLockup } from "@/components/ui/marca";
import { Bolha } from "@/components/ui/bolha";

// O que o app faz, dito do lado de quem estuda — nao da arquitetura.
const RECURSOS = [
  {
    titulo: "Treino comentado",
    texto:
      "Correção na hora, com o porquê de cada alternativa e o artigo que sustenta a resposta.",
  },
  {
    titulo: "Simulado cronometrado",
    texto: "A mesma pressão da prova: o relógio correndo e o gabarito só no final.",
  },
  {
    titulo: "Revisão espaçada",
    texto:
      "O que você erra volta em 1, 3, 7, 15 e 30 dias — no dia em que você ia esquecer.",
  },
];

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    // Duas folhas lado a lado, separadas por uma regua: a da esquerda se
    // apresenta, a da direita e o formulario. Abaixo de `lg` sobra so a
    // segunda — numa tela de celular a apresentacao atrasa quem so quer entrar.
    <div className="relative flex flex-1 flex-col lg:grid lg:grid-cols-[1.15fr_1fr] xl:grid-cols-[1.3fr_1fr]">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <section className="hidden flex-col justify-center border-r border-slate-800 bg-slate-900/40 p-12 xl:p-20 lg:flex">
        <div className="max-w-lg">
          <MarcaLockup className="mb-10" />

          <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-slate-100 xl:text-5xl">
            Sua aprovação começa por aqui.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">
            Uma plataforma inteira dedicada a um edital só. Sem dispersão, sem
            matéria que não cai.
          </p>

          <ul className="mt-12 space-y-6">
            {RECURSOS.map((r) => (
              <li key={r.titulo} className="flex gap-4">
                {/* A bolha do cartao-resposta faz as vezes de marcador: e o
                    mesmo simbolo que a pessoa vai marcar dentro do app. */}
                <Bolha estado="marcada" tamanho="md" className="mt-1" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-100">{r.titulo}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{r.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center p-4 lg:p-10">
        <div className="w-full max-w-sm">
          {/* Abaixo de `lg` a marca some do painel da esquerda, entao ela
              reaparece aqui — alinhada a esquerda, como o cabecalho de uma
              folha de prova. */}
          <div className="mb-6 lg:hidden">
            <MarcaLockup className="mb-4" />
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              Sua aprovação começa por aqui. Foco total no edital.
            </p>
          </div>

          <Card>
            <CardHeader>
              <h2 className="etiqueta">Entrar</h2>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
