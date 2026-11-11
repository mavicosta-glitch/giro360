import Image from "next/image";
import Link from "next/link";
import { Clock, User } from "lucide-react";
import type { Article } from "@/domain/entities/article";
import { formatPtBrDate } from "@/lib/formatters";

interface HeroSectionProps {
  article: Article;
}

/**
 * Manchete Principal (HeroSection):
 * - Imagem de alta performance com `priority` para otimizar LCP (Largest Contentful Paint).
 * - Bloco editorial vermelho (#C80A14) com contraste WCAG AA+ entre texto branco e fundo.
 */
export function HeroSection({ article }: HeroSectionProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-sm border border-slate-200 bg-[#C80A14] shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={`/noticia/${article.slug}`}
        className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#05226B]"
      >
        {/* Container da imagem com aspect-ratio fixo (CLS = 0) */}
        <div className="relative aspect-[16/11] w-full overflow-hidden bg-slate-900">
          <Image
            src={article.coverImage}
            alt={article.coverAlt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 55vw, 480px"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#C80A14]/45 to-transparent"
          />
        </div>

        {/* Bloco Vermelho de Destaque Editorial */}
        <div className="flex flex-1 flex-col justify-between bg-[#C80A14] p-5 text-white sm:p-6">
          <div>
            <span className="inline-block rounded-xs border border-white/85 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
              {article.categoryName}
            </span>

            <h1 className="mt-3 font-display text-xl font-black leading-tight tracking-tight text-white group-hover:underline sm:text-2xl lg:text-[1.65rem]">
              {article.title}
            </h1>

            <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-white/95">
              {article.subtitle}
            </p>
          </div>

          <footer className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/25 pt-3 text-xs font-medium text-white/95">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              {article.authorName}
            </span>
            <time
              dateTime={article.publishedAt}
              className="inline-flex items-center gap-1.5"
            >
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {formatPtBrDate(article.publishedAt)}
            </time>
          </footer>
        </div>
      </Link>
    </article>
  );
}

