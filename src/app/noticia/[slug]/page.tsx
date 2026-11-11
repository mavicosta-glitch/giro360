import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ChevronRight, Clock, Eye, Tag, User } from "lucide-react";
import { portalService } from "@/application/services/portal-service";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { JsonLdScript } from "@/components/portal/JsonLdScript";
import { NewsCard } from "@/components/portal/NewsCard";
import { ShareButtons } from "@/components/portal/ShareButtons";
import { SidebarWidgets } from "@/components/portal/SidebarWidgets";
import {
  formatNumberPtBr,
  formatPtBrDateTime,
} from "@/lib/formatters";
import {
  buildBreadcrumbJsonLd,
  buildNewsArticleJsonLd,
  SITE_CONFIG,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await portalService.getArticleDetail(slug, false);
  if (!detail) {
    return {
      title: "Matéria não encontrada",
      robots: { index: false, follow: false },
    };
  }

  const { article } = detail;
  const canonical = `${SITE_CONFIG.url}/noticia/${article.slug}`;

  return {
    title: article.title,
    description: article.subtitle,
    keywords: article.tags,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: article.title,
      description: article.subtitle,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      section: article.categoryName,
      authors: [article.authorName],
      images: [
        {
          url: article.coverImage,
          alt: article.coverAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.subtitle,
      images: [article.coverImage],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const detail = await portalService.getArticleDetail(slug, true);
  if (!detail) {
    notFound();
  }

  const { article, related, mostRead, menuCategories, sidebarBanners } = detail;

  const newsArticleJsonLd = buildNewsArticleJsonLd(article);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: article.categoryName, path: `/categoria/${article.categorySlug}` },
    { name: article.title, path: `/noticia/${article.slug}` },
  ]);

  const paragraphs = article.content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <JsonLdScript data={newsArticleJsonLd} />
      <JsonLdScript data={breadcrumbJsonLd} />

      <Header categories={menuCategories} />

      <main id="conteudo-principal" className="min-h-screen bg-white py-6">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          {/* Breadcrumb Semântico */}
          <nav
            aria-label="Navegação estrutural"
            className="mb-5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-600"
          >
            <Link href="/" className="hover:text-[#05226B] hover:underline">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <Link
              href={`/categoria/${article.categorySlug}`}
              className="font-bold uppercase tracking-wide hover:underline"
              style={{ color: article.categoryColor || "#05226B" }}
            >
              {article.categoryName}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <span className="truncate text-slate-500 max-w-xs sm:max-w-md">
              {article.title}
            </span>
          </nav>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Conteúdo da Reportagem */}
            <article className="lg:col-span-8">
              <header>
                <Link
                  href={`/categoria/${article.categorySlug}`}
                  className="inline-block rounded-xs px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-white"
                  style={{ backgroundColor: article.categoryColor || "#05226B" }}
                >
                  {article.categoryName}
                </Link>

                <h1 className="mt-3 font-display text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
                  {article.title}
                </h1>

                <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
                  {article.subtitle}
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-y border-slate-200 py-3.5">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                      <User className="h-4 w-4 text-[#05226B]" aria-hidden="true" />
                      {article.authorName}
                      <span className="font-normal text-slate-500">
                        ({article.authorRole})
                      </span>
                    </span>

                    <time
                      dateTime={article.publishedAt}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatPtBrDateTime(article.publishedAt)}
                    </time>

                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                      {article.readingTimeMinutes} min de leitura
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatNumberPtBr(article.views)} leituras
                    </span>
                  </div>

                  <ShareButtons title={article.title} slug={article.slug} />
                </div>
              </header>

              {/* Imagem Principal (Priority LCP) */}
              <figure className="my-6">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-sm bg-slate-100">
                  <Image
                    src={article.coverImage}
                    alt={article.coverAlt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 780px"
                    className="object-cover"
                  />
                </div>
                {article.imageCaption && (
                  <figcaption className="mt-2 text-xs text-slate-500">
                    {article.imageCaption}
                  </figcaption>
                )}
              </figure>

              {/* Corpo Editorial */}
              <div className="space-y-5 text-base leading-8 text-slate-800 sm:text-[1.0625rem]">
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {/* Tags SEO */}
              {article.tags.length > 0 && (
                <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-5">
                  <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                    Assuntos:
                  </span>
                  {article.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/busca?q=${encodeURIComponent(tag)}`}
                      className="rounded-xs border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-[#05226B] hover:text-[#05226B]"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Matérias Relacionadas */}
              {related.length > 0 && (
                <section
                  aria-labelledby="related-heading"
                  className="mt-10 border-t-2 border-[#05226B] pt-6"
                >
                  <h2
                    id="related-heading"
                    className="mb-4 font-display text-lg font-black uppercase tracking-tight text-[#05226B]"
                  >
                    Leia Também
                  </h2>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    {related.map((item) => (
                      <NewsCard key={item.id} article={item} variant="grid" />
                    ))}
                  </div>
                </section>
              )}
            </article>

            {/* Barra Lateral */}
            <div className="lg:col-span-4">
              <SidebarWidgets
                mostRead={mostRead}
                categories={menuCategories}
                banners={sidebarBanners}
                showTopBanner
              />
            </div>
          </div>
        </div>
      </main>

      <Footer categories={menuCategories} />
    </>
  );
}

