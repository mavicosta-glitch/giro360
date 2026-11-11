import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, FolderOpen, PlusCircle } from "lucide-react";
import { portalService } from "@/application/services/portal-service";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { JsonLdScript } from "@/components/portal/JsonLdScript";
import { NewsCard } from "@/components/portal/NewsCard";
import { SidebarWidgets } from "@/components/portal/SidebarWidgets";
import { buildBreadcrumbJsonLd, SITE_CONFIG } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await portalService.getCategoryPageData(slug);
  if (!data) {
    return {
      title: "Editoria não encontrada",
      robots: { index: false, follow: false },
    };
  }

  const canonical = `${SITE_CONFIG.url}/categoria/${data.category.slug}`;
  const description =
    data.category.description ||
    `Últimas notícias e reportagens da editoria ${data.category.name} no portal BA Infoco.`;

  return {
    title: `${data.category.name} — Últimas Notícias`,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${data.category.name} | BA Infoco`,
      description,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const data = await portalService.getCategoryPageData(slug);
  if (!data) {
    notFound();
  }

  const { category, articles, mostRead, menuCategories, sidebarBanners } = data;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: category.name, path: `/categoria/${category.slug}` },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <Header categories={menuCategories} />

      <main id="conteudo-principal" className="min-h-screen bg-white py-6">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav
            aria-label="Navegação estrutural"
            className="mb-4 flex items-center gap-1.5 text-xs font-medium text-slate-600"
          >
            <Link href="/" className="hover:text-[#123B50] hover:underline">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#263746]/40" aria-hidden="true" />
            <span className="font-bold text-[#123B50]">{category.name}</span>
          </nav>

          {/* Cabeçalho da Editoria */}
          <header
            className="mb-6 rounded-sm border border-[#123B50]/12 bg-[#EAF0F2] p-5 sm:p-6"
            style={{ borderLeftWidth: "6px", borderLeftColor: category.color }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span
                  className="text-[11px] font-extrabold uppercase tracking-widest"
                  style={{ color: category.color }}
                >
                  Editoria BA Infoco
                </span>
                <h1 className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-[#123B50] sm:text-3xl">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="mt-1.5 max-w-2xl text-sm text-[#263746]">
                    {category.description}
                  </p>
                )}
              </div>
              <span className="rounded-full border border-[#123B50]/15 bg-white px-3 py-1 text-xs font-bold text-[#123B50]">
                {articles.length}{" "}
                {articles.length === 1 ? "matéria" : "matérias"}
              </span>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              {articles.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-[#123B50]/25 bg-[#EAF0F2] px-6 py-16 text-center">
                  <FolderOpen
                    className="h-10 w-10 text-[#123B50]/40"
                    aria-hidden="true"
                  />
                  <h2 className="mt-3 font-display text-lg font-bold text-[#123B50]">
                    Ainda não há matérias publicadas em {category.name}
                  </h2>
                  <p className="mt-1 max-w-md text-sm text-[#263746]/80">
                    Você pode publicar a primeira notícia desta editoria diretamente pelo Painel Administrativo.
                  </p>
                  <Link
                    href="/admin"
                    className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#123B50] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#263746]"
                  >
                    <PlusCircle className="h-4 w-4" aria-hidden="true" />
                    Ir para o Painel Admin
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {articles.map((article) => (
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

