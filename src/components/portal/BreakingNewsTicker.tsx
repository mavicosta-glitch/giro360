"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Pause, Play, Radio } from "lucide-react";
import type { Article } from "@/domain/entities/article";

interface BreakingNewsTickerProps {
  initialArticles: Article[];
}

/**
 * Ticker de Últimas Notícias ("Destaques"):
 * - Hidratado no SSR sem flicker e sincronizado em tempo real via TanStack Query.
 * - Controles acessíveis de pausa/avanço conforme WCAG 2.2.2 (Pause, Stop, Hide).
 */
export function BreakingNewsTicker({
  initialArticles,
}: BreakingNewsTickerProps) {
  const { data: articles } = useQuery<Article[]>({
    queryKey: ["breaking-news-ticker"],
    queryFn: async () => {
      const res = await fetch("/api/articles?status=published&isBreaking=true&limit=8");
      if (!res.ok) return initialArticles;
      const json = (await res.json()) as { articles?: Article[] };
      return json.articles && json.articles.length > 0
        ? json.articles
        : initialArticles;
    },
    initialData: initialArticles,
    refetchInterval: 45_000,
    staleTime: 20_000,
  });

  const items = articles.length > 0 ? articles : initialArticles;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const safeIndex = items.length > 0 ? activeIndex % items.length : 0;

  useEffect(() => {
    if (isPaused || items.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [isPaused, items.length]);

  if (items.length === 0) return null;

  const currentArticle = items[safeIndex];
  const nextArticle = items[(safeIndex + 1) % items.length];

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <section
      aria-label="Destaques e últimas notícias urgentes"
      className="mx-auto mt-4 mb-4 max-w-[1200px] px-4 sm:px-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex min-h-[42px] items-stretch overflow-hidden rounded-sm border border-[#123B50]/15 bg-[#EAF0F2]">
        {/* Selo Dourado Destaques */}
        <div className="flex shrink-0 items-center gap-1.5 bg-[#D6A843] px-3.5 py-2 text-[#123B50] sm:px-4">
          <Radio className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
          <span className="text-xs font-extrabold tracking-wide sm:text-sm">
            Destaques
          </span>
        </div>

        {/* Manchetes Rotativas */}
        <div className="flex min-w-0 flex-1 items-center gap-6 px-3.5 py-2">
          <Link
            href={`/noticia/${currentArticle.slug}`}
            className="group flex min-w-0 flex-1 items-baseline gap-1.5 text-xs text-[#263746] transition-colors hover:text-[#123B50] sm:text-sm"
          >
            <strong className="shrink-0 font-extrabold text-[#123B50]">
              {currentArticle.categoryName}
            </strong>
            <span aria-hidden="true" className="text-[#263746]/45">
              -
            </span>
            <span className="truncate font-medium group-hover:underline">
              {currentArticle.title}
            </span>
          </Link>

          {/* Segunda manchete visível em telas largas, fiel à referência editorial */}
          {items.length > 1 && nextArticle && (
            <Link
              href={`/noticia/${nextArticle.slug}`}
              className="group hidden min-w-0 flex-1 items-baseline gap-1.5 border-l border-[#123B50]/15 pl-5 text-xs text-[#263746]/85 transition-colors hover:text-[#123B50] lg:flex lg:text-sm"
            >
              <strong className="shrink-0 font-extrabold text-[#123B50]">
                {nextArticle.categoryName}
              </strong>
              <span aria-hidden="true" className="text-[#263746]/45">
                -
              </span>
              <span className="truncate font-medium group-hover:underline">
                {nextArticle.title}
              </span>
            </Link>
          )}
        </div>

        {/* Controles Acessíveis de Rotação */}
        {items.length > 1 && (
          <div className="flex shrink-0 items-center border-l border-[#123B50]/15 bg-white/80 px-1">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Manchete anterior"
              className="inline-flex h-8 w-7 items-center justify-center rounded text-[#263746] hover:bg-[#EAF0F2] hover:text-[#123B50]"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              aria-label={
                isPaused
                  ? "Retomar rotação automática dos destaques"
                  : "Pausar rotação automática dos destaques"
              }
              className="inline-flex h-8 w-7 items-center justify-center rounded text-[#263746] hover:bg-[#EAF0F2] hover:text-[#123B50]"
            >
              {isPaused ? (
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Próxima manchete"
              className="inline-flex h-8 w-7 items-center justify-center rounded text-[#263746] hover:bg-[#EAF0F2] hover:text-[#123B50]"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

