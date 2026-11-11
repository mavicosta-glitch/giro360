import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { portalService } from "@/application/services/portal-service";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default async function NotFoundPage() {
  let menuCategories: Awaited<
    ReturnType<typeof portalService.getMenuCategories>
  > = [];
  try {
    menuCategories = await portalService.getMenuCategories();
  } catch {
    menuCategories = [];
  }

  return (
    <>
      <Header categories={menuCategories} />
      <main
        id="conteudo-principal"
        className="flex min-h-[60vh] flex-col items-center justify-center bg-white px-4 py-16 text-center"
      >
        <span className="rounded-xs bg-[#D6A843] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#123B50]">
          Erro 404
        </span>
        <h1 className="mt-4 font-display text-3xl font-black text-[#123B50] sm:text-4xl">
          Página ou matéria não encontrada
        </h1>
        <p className="mt-2 max-w-md text-sm text-[#263746]/80">
          O endereço acessado pode ter sido removido ou alterado. Utilize o menu de editorias ou faça uma busca no arquivo.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-[#123B50] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#263746]"
          >
            <ArrowLeft className="h-4 w-4 text-[#D6A843]" aria-hidden="true" />
            Voltar para a Capa
          </Link>
          <Link
            href="/busca"
            className="inline-flex items-center gap-2 rounded-md border border-[#123B50]/25 bg-[#EAF0F2] px-5 py-2.5 text-sm font-bold text-[#123B50] hover:bg-[#123B50]/10"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Buscar no Portal
          </Link>
        </div>
      </main>
      <Footer categories={menuCategories} />
    </>
  );
}
