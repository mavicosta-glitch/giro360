import type { Metadata } from "next";
import { portalService } from "@/application/services/portal-service";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SearchClient } from "@/components/portal/SearchClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buscar Notícias",
  description:
    "Pesquise no arquivo de reportagens, notícias da Bahia, economia, esportes e editorias do portal BA Infoco.",
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const categorySlug = params.categoria?.trim() ?? "";

  const [menuCategories, initialArticles] = await Promise.all([
    portalService.getMenuCategories(),
    portalService.searchPublishedArticles(query, categorySlug || undefined),
  ]);

  return (
    <>
      <Header categories={menuCategories} />

      <main id="conteudo-principal" className="min-h-screen bg-white py-8">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <header className="mb-6 border-b-2 border-[#123B50] pb-3">
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#123B50] sm:text-3xl">
              Arquivo & Busca de Notícias
            </h1>
            <p className="mt-1 text-sm text-[#263746]/80">
              Encontre matérias publicadas no portal BA Infoco em tempo real.
            </p>
          </header>

          <SearchClient
            initialQuery={query}
            initialCategorySlug={categorySlug}
            initialArticles={initialArticles}
            categories={menuCategories}
          />
        </div>
      </main>

      <Footer categories={menuCategories} />
    </>
  );
}
