"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import type { Article } from "@/domain/entities/article";
import type { MenuCategoryItem } from "@/components/layout/MobileDrawer";
import { NewsCard } from "@/components/portal/NewsCard";

interface SearchClientProps {
  initialQuery: string;
  initialCategorySlug: string;
  initialArticles: Article[];
  categories: MenuCategoryItem[];
}

export function SearchClient({
  initialQuery,
  initialCategorySlug,
  initialArticles,
  categories,
}: SearchClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [categorySlug, setCategorySlug] = useState(initialCategorySlug);

  const searchQuery = useQuery<Article[]>({
    queryKey: ["portal-search", query, categorySlug],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: "published",
        limit: "40",
      });
      if (query.trim()) params.set("q", query.trim());
      if (categorySlug) params.set("categorySlug", categorySlug);

      const res = await fetch(`/api/articles?${params.toString()}`);
      if (!res.ok) throw new Error("Falha ao buscar notícias.");
      const json = (await res.json()) as { articles: Article[] };
      return json.articles;
    },
    initialData:
      query === initialQuery && categorySlug === initialCategorySlug
        ? initialArticles
        : undefined,
    placeholderData: (previous) => previous,
  });

  const results = searchQuery.data ?? [];

  return (
    <div className="space-y-6">
      {/* Formulário de Busca Instantânea */}
      <div className="rounded-sm border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-8">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <label htmlFor="portal-search-input" className="sr-only">
              Pesquisar notícias
            </label>
            <input
              id="portal-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por assunto, manchete, tag ou autor..."
              className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-[#05226B] focus:outline-none"
            />
          </div>

          <div className="md:col-span-4">
            <label htmlFor="portal-search-category" className="sr-only">
              Filtrar por editoria
            </label>
            <select
              id="portal-search-category"
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 focus:border-[#05226B] focus:outline-none"
            >
              <option value="">Todas as Editorias</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
          <span>
            {results.length}{" "}
            {results.length === 1
              ? "resultado encontrado"
              : "resultados encontrados"}
          </span>
          {searchQuery.isFetching && (
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#05226B]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Atualizando...
            </span>
          )}
        </div>
      </div>

      {/* Grid de Resultados */}
      {results.length === 0 ? (
        <div className="rounded-sm border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="font-display text-base font-bold text-slate-800">
            Nenhuma matéria encontrada para essa pesquisa.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Tente outros termos ou remova o filtro de editoria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              variant="grid"
              showExcerpt
            />
          ))}
        </div>
      )}
    </div>
  );
}

