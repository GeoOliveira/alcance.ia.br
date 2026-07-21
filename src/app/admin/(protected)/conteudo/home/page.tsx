import { redirect } from "next/navigation";

export default function LegacyHomeContentPage() {
  redirect("/admin/conteudo/paginas?pagina=home");
}
