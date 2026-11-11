import Link from "next/link";
import { CloudSun, Eye, Flame, TrendingUp } from "lucide-react";
import type { Article } from "@/domain/entities/article";
import type { AdBannerData } from "@/domain/entities/banner";
import type { MenuCategoryItem } from "@/components/layout/MobileDrawer";
import { AdBanner } from "@/components/portal/AdBanner";
import { NewsletterBox } from "@/components/portal/NewsletterBox";
import { formatNumberPtBr } from "@/lib/formatters";

interface SidebarWidgetsProps {
  mostRead: Article[];
  categories: MenuCategoryItem[];
  banners?: AdBannerData[];
  showTopBanner?: boolean;
}

const DEFAULT_SIDEBAR_AD_PRIMARY: AdBannerData = {
  id: "salvador-square-ad",
  advertiser: "Salvador Prefeitura",
  subheadline: "Voga",
  headline: "E muito mais!",
  badgeText: "Publicidade Institucional",
  href: "/categoria/bahia",
  variant: "rectangle",
  theme: "institutional-navy",
};

const DEFAULT_SIDEBAR_AD_SECONDARY: AdBannerData = {
  id: "agro-bahia-ad",
  advertiser: "Agro Bahia Forte",
  subheadline: "Safra 2026",
  headline: "Energia que move o Oeste",
  badgeText: "Informe Especial",
  href: "/categoria/agricultura",
  variant: "rectangle",
  theme: "agro-green",
};

/**
 * Barra Lateral Editorial (SidebarWidgets):
 * - Banner institucional retangular 4:3
 * - Ranking "Mais Lidas"
 * - Painel Regional Bahia (Clima & Indicadores)
 * - Newsletter & Nuvem de Editorias
 */
export function SidebarWidgets({
  mostRead,
  categories,
  banners,
  showTopBanner = true,
}: SidebarWidgetsProps) {
  const primaryBanner = banners?.[0] ?? DEFAULT_SIDEBAR_AD_PRIMARY;
  const secondaryBanner = banners?.[1] ?? DEFAULT_SIDEBAR_AD_SECONDARY;

  return (
    <aside aria-label="Destaques laterais e widgets" className="space-y-6">
      {showTopBanner && <AdBanner banner={primaryBanner} />}

      {/* Widget Mais Lidas */}
      <section
        aria-labelledby="most-read-heading"
        className="rounded-sm border border-[#123B50]/12 bg-white p-4 shadow-2xs"
      >
        <div className="flex items-center justify-between border-b-2 border-[#123B50] pb-2.5">
          <h2
            id="most-read-heading"
            className="flex items-center gap-2 font-display text-sm font-black uppercase tracking-wider text-[#123B50]"
          >
            <Flame className="h-4 w-4 text-[#D6A843]" aria-hidden="true" />
            Mais Lidas
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Top 5
          </span>
        </div>

        <ol className="divide-y divide-slate-100">
          {mostRead.map((item, idx) => (
            <li key={item.id} className="py-3 first:pt-3 last:pb-1">
              <Link
                href={`/noticia/${item.slug}`}
                className="group flex items-start gap-3 rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6A843]"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xs font-display text-sm font-black ${
                    idx === 0
                      ? "bg-[#D6A843] text-[#123B50]"
                      : idx < 3
                        ? "bg-[#123B50] text-white"
                        : "bg-[#EAF0F2] text-[#263746]"
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ color: item.categoryColor || "#123B50" }}
                  >
                    {item.categoryName}
                  </span>
                  <h3 className="mt-0.5 line-clamp-2 text-xs font-bold leading-snug text-[#263746] group-hover:text-[#123B50] group-hover:underline sm:text-[13px]">
                    {item.title}
                  </h3>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <Eye className="h-3 w-3" aria-hidden="true" />
                    {formatNumberPtBr(item.views)} leituras
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* Widget Panorama Regional Bahia */}
      <section
        aria-labelledby="panorama-ba-heading"
        className="rounded-sm border border-[#123B50]/12 bg-[#EAF0F2] p-4"
      >
        <h2
          id="panorama-ba-heading"
          className="flex items-center gap-2 border-b border-[#123B50]/15 pb-2 font-display text-xs font-black uppercase tracking-wider text-[#123B50]"
        >
          <CloudSun className="h-4 w-4 text-[#D6A843]" aria-hidden="true" />
          Salvador & Economia Hoje
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
          <div className="rounded-xs border border-[#123B50]/12 bg-white p-2.5">
            <p className="text-[10px] font-bold uppercase text-[#263746]/70">
              Salvador (BA)
            </p>
            <p className="mt-0.5 font-display text-base font-black text-[#123B50]">
              28°C
            </p>
            <p className="text-[11px] text-[#263746]/80">Sol com brisa costeira</p>
          </div>
          <div className="rounded-xs border border-[#123B50]/12 bg-white p-2.5">
            <p className="text-[10px] font-bold uppercase text-[#263746]/70">
              Mercado
            </p>
            <p className="mt-0.5 flex items-center gap-1 font-display text-base font-black text-[#123B50]">
              <TrendingUp className="h-3.5 w-3.5 text-[#D6A843]" aria-hidden="true" />
              Agro +7%
            </p>
            <p className="text-[11px] text-[#263746]/80">Safra Oeste Baiano</p>
          </div>
        </div>
      </section>

      <NewsletterBox />

      <AdBanner banner={secondaryBanner} />

      {/* Mapa Rápido de Editorias */}
      <section
        aria-labelledby="sidebar-categories-heading"
        className="rounded-sm border border-[#123B50]/12 bg-white p-4"
      >
        <h2
          id="sidebar-categories-heading"
          className="border-b border-[#123B50]/15 pb-2 font-display text-xs font-black uppercase tracking-wider text-[#123B50]"
        >
          Explorar Editorias
        </h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categoria/${cat.slug}`}
              className="rounded-xs border border-[#123B50]/15 bg-[#EAF0F2] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#263746] transition-colors hover:border-[#123B50] hover:bg-[#123B50] hover:text-[#D6A843]"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>
    </aside>
  );
}
