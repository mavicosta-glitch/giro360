import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { Article } from "@/domain/entities/article";
import { formatPtBrDate } from "@/lib/formatters";

export type NewsCardVariant = "featured" | "grid" | "compact";

interface NewsCardProps {
  article: Article;
  variant?: NewsCardVariant;
  showExcerpt?: boolean;
}

/**
 * Card editorial reutilizável com carregamento lazy obrigatório nas imagens secundárias.
 */
export function NewsCard({
  article,
  variant = "grid",
  showExcerpt = false,
}: NewsCardProps) {
  if (variant === "compact") {
    return (
      <article className="group border-b border-slate-200 py-3.5 last:border-b-0">
        <Link
          href={`/noticia/${article.slug}`}
          className="flex items-start gap-3.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C80A14]"
        >
          <div className="relative aspect-[16/10] w-28 shrink-0 overflow-hidden rounded-xs bg-slate-100 sm:w-32">
            <Image
              src={article.coverImage}
              alt={article.coverAlt}
              fill
              loading="lazy"
              sizes="128px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span
              className="text-[11px] font-extrabold uppercase tracking-wider"
              style={{ color: article.categoryColor || "#05226B" }}
            >
              {article.categoryName}
            </span>
            <h3 className="mt-1 line-clamp-2 font-display text-sm font-bold leading-snug text-slate-900 group-hover:text-[#05226B] group-hover:underline">
              {article.title}
            </h3>
            <time
              dateTime={article.publishedAt}
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500"
            >
              <Clock className="h-3 w-3" aria-hidden="true" />
              {formatPtBrDate(article.publishedAt)}
            </time>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "featured") {
    return (
      <article className="group flex flex-col overflow-hidden rounded-sm bg-white transition-colors">
        <Link
          href={`/noticia/${article.slug}`}
          className="flex flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C80A14]"
        >
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xs bg-slate-100">
            <Image
              src={article.coverImage}
              alt={article.coverAlt}
              fill
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 32vw, 280px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <div className="pt-2.5">
            <span
              className="text-xs font-bold tracking-wide"
              style={{ color: article.categoryColor || "#05226B" }}
            >
              {article.categoryName}
            </span>
            <h2 className="mt-1 line-clamp-3 font-display text-base font-extrabold leading-snug text-slate-950 transition-colors group-hover:text-[#05226B] group-hover:underline">
              {article.title}
            </h2>
            <time
              dateTime={article.publishedAt}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500"
            >
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {formatPtBrDate(article.publishedAt)}
            </time>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-sm border border-slate-200 bg-white shadow-2xs transition-shadow hover:shadow-md">
      <Link
        href={`/noticia/${article.slug}`}
        className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C80A14]"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
          <Image
            src={article.coverImage}
            alt={article.coverAlt}
            fill
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span
            className="absolute left-3 top-3 rounded-xs px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs"
            style={{ backgroundColor: article.categoryColor || "#05226B" }}
          >
            {article.categoryName}
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <h3 className="line-clamp-3 font-display text-base font-extrabold leading-snug text-slate-950 transition-colors group-hover:text-[#05226B] group-hover:underline">
              {article.title}
            </h3>
            {showExcerpt && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">
                {article.subtitle}
              </p>
            )}
          </div>

          <footer className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] font-medium text-slate-500">
            <time
              dateTime={article.publishedAt}
              className="inline-flex items-center gap-1"
            >
              <Clock className="h-3 w-3" aria-hidden="true" />
              {formatPtBrDate(article.publishedAt)}
            </time>
            <span>{article.readingTimeMinutes} min</span>
          </footer>
        </div>
      </Link>
    </article>
  );
}

