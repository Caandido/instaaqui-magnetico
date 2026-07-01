// "Projetos" foi unificado em um único espaço da empresa. Mantido só para
// não quebrar links antigos: redireciona para /empresa.
import { redirect } from "next/navigation";

export default function ProjetosRedirect() {
  redirect("/empresa");
}
