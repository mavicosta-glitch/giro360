import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import type { PortalHomeData } from "@/domain/entities/article";
import type { AdBannerData } from "@/domain/entities/banner";
import { AdBanner } from "@/components/portal/AdBanner";
import { HeroSection } from "@/components/portal/HeroSection";
import { NewsCard } from "@/components/portal/NewsCard";
import { SidebarWidgets } from "@/components/portal/SidebarWidgets";

interface NewsGridProps {
  data: PortalHomeData;
}

const LEADERBOARD_BANNER: AdBannerData = {
  id: "salvador-leaderboard",
  advertiser: "Salvador Prefeitura",
  headline: "E muito mais!",
  subheadline: "Obras, mobilidade e serviços em toda a capital",
  badgeText: "Campanha Institucional",
  ctaLabel: "Conheça as ações",
  href: "/categoria/bahia",
  variant: "leaderboard",
  theme: "salvador-blue",
};

/**
 * Grid Principal Editorial (NewsGrid):
 * - Layout assimétrico inspirado nos grandes portais regionais brasileiros.
 * - Coluna editorial principal (8/12) com banner horizontal, Hero + Destaques secundários e editorias.
 * - Barra lateral (4/12) com mídia institucional, Mais Lidas e widgets regionais.
 */
export function NewsGrid({ data }: NewsGridProps) {
  const {
    heroArticle,
    secondaryFeatured,
    latestNews,
    mostRead,
    categorySections,
    menuCategories,
  } = data;

  const recentFeed = latestNews.slice(0, 6);

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-12 sm:px-6">
      {/* Zona Editorial Assimétrica Principal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Coluna Editorial Esquerda / Centro (8/12) */}
        <div className="space-y-8 lg:col-span-8">
          {/* Banner Leaderboard Superior alinhado ao layout de referência */}
          <AdBanner banner={LEADERBOARD_BANNER} />

          {/* Bloco Hero + Coluna Secundária */}
          <section aria-label="Manchete principal e destaques">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
              {heroArticle && (
                <div className="md:col-span-7">
                  <HeroSection article={heroArticle} />
                </div>
              )}

              <div
                className={
                  heroArticle
                    ? "flex flex-col gap-5 md:col-span-5"
                    : "grid grid-cols-1 gap-5 sm:grid-cols-2 md:col-span-12"
                }
              >
                {secondaryFeatured.map((article) => (
                  <NewsCard
                    key={article.id}
                    article={article}
                    variant="featured"
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Feed de Últimas Notícias */}
          {recentFeed.length > 0 && (
            <section aria-labelledby="latest-news-heading">
              <div className="mb-4 flex items-center justify-between border-b-2 border-[#05226B] pb-2">
                <h2
                  id="latest-news-heading"
                  className="flex items-center gap-2 font-display text-lg font-black uppercase tracking-tight text-[#05226B]"
                >
                  <span
                    className="inline-block h-5 w-1.5 bg-[#C80A14]"
                    aria-hidden="true"
                  />
                  <Newspaper className="h-5 w-5 text-[#C80A14]" aria-hidden="true" />
                  Últimas Notícias
                </h2>
                <Link
                  href="/busca"
                  className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#05226B] hover:text-[#C80A14]"
                >
                  Ver arquivo
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {recentFeed.map((article) => (
                  <NewsCard
                    key={article.id}
                    article={article}
                    variant="grid"
                    showExcerpt
                  />
                ))}
              </div>
            </section>
          )}

          {/* Blocos Assimétricos por Editoria */}
          {categorySections.length > 0 && (
            <section
              aria-label="Cobertura por editorias"
              className="space-y-8 pt-2"
            >
              {categorySections.map(({ category, articles }) => {
                const leadArticle = articles[0];
                const restArticles = articles.slice(1);
                if (!leadArticle) return null;

                return (
                  <div
                    key={category.id}
                    className="rounded-sm border border-slate-200 bg-white p-4 sm:p-5"
                  >
                    <div
                      className="mb-4 flex items-center justify-between border-b-2 pb-2"
                      style={{ borderColor: category.color }}
                    >
                      <h2
                        className="font-display text-base font-black uppercase tracking-wider"
                        style={{ color: category.color }}
                      >
                        {category.name}
                      </h2>
                      <Link
                        href={`/categoria/${category.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-[#05226B]"
                      >
                        Mais em {category.name}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                      <div
                        className={
                          restArticles.length > 0
                            ? "md:col-span-6"
                            : "md:col-span-12"
                        }
                      >
                        <NewsCard
                          article={leadArticle}
                          variant="grid"
                          showExcerpt
                        />
                      </div>

                      {restArticles.length > 0 && (
                        <div className="flex flex-col justify-start md:col-span-6">
                          {restArticles.map((art) => (
                            <NewsCard
                              key={art.id}
                              article={art}
                              variant="compact"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </div>

        {/* Barra Lateral (4/12) */}
        <div className="lg:col-span-4">
          <SidebarWidgets
            mostRead={mostRead}
            categories={menuCategories}
            showTopBanner
          />
        </div>
      </div>
    </div>
  );
}

