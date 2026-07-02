import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Nav } from "@/components/nav";
import { listarConcursos, getConcursoAtualId } from "@/server/concurso";

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
        concursos={concursos}
        concursoAtualId={concursoAtualId}
      />
      <main className="flex-1 overflow-y-auto p-4 md:h-screen md:p-8">{children}</main>
    </div>
  );
}
