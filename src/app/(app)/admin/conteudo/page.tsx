import { redirect } from "next/navigation";

/** A tela de conteudo deixou de ser exclusiva do admin e mudou para /conteudo,
 *  onde as abas Questões e Estudo continuam aparecendo so para administradores.
 *  Este redirect existe para nao quebrar link salvo. */
export default function AdminConteudoPage() {
  redirect("/conteudo");
}
