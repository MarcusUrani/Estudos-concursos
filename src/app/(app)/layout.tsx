import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Nav } from "@/components/nav";
import { listarConcursos, getConcursoAtualId } from "@/server/concurso";
import { podeAcessarRevisao } from "@/lib/acesso";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [concursos, concursoAtualId] = await Promise.all([
    listarConcursos(),
    getConcursoAtualId(),
  ]);

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <Nav
        nome={session.user.name ?? "Estudante"}
        isAdmin={session.user.role === "admin"}
        podeRevisar={podeAcessarRevisao(session.user.email)}
        concursos={concursos}
        concursoAtualId={concursoAtualId}
      />
      {/* `overflow-x-clip` e trava de seguranca, nao a correcao: se algum
          conteudo furar a largura, ele e cortado em vez de tornar a PAGINA
          rolavel na horizontal. Isso importa porque o cabecalho do celular e
          `sticky`, que gruda so na vertical — com a pagina rolando de lado, o
          cabecalho acompanha e o botao do menu sai do campo visivel, dando a
          impressao de que o menu parou de abrir.
          `clip` e nao `hidden` de proposito: `hidden` criaria um contexto de
          rolagem e quebraria o `position: sticky` do trilho aqui dentro. */}
      <main className="flex-1 overflow-y-auto overflow-x-clip p-4 md:h-screen md:p-8">
        {children}
      </main>
    </div>
  );
}
