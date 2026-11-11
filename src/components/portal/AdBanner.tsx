import Link from "next/link";
import { Building2, ExternalLink } from "lucide-react";
import type { AdBannerData } from "@/domain/entities/banner";

interface AdBannerProps {
  banner: AdBannerData;
}

const THEME_STYLES: Record<
  AdBannerData["theme"],
  { bg: string; accent: string; badge: string }
> = {
  "salvador-blue": {
    bg: "bg-gradient-to-r from-[#041E68] via-[#0B3AA4] to-[#041E68]",
    accent: "text-[#FFD400]",
    badge: "bg-white/15 text-white border-white/25",
  },
  "agro-green": {
    bg: "bg-gradient-to-r from-[#0E4D25] via-[#15803D] to-[#0E4D25]",
    accent: "text-[#FDE047]",
    badge: "bg-white/15 text-white border-white/25",
  },
  "commerce-gold": {
    bg: "bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B]",
    accent: "text-[#FBBF24]",
    badge: "bg-[#FBBF24]/15 text-[#FDE68A] border-[#FBBF24]/30",
  },
  "institutional-navy": {
    bg: "bg-gradient-to-br from-[#031649] via-[#05226B] to-[#0A349C]",
    accent: "text-[#FFD400]",
    badge: "bg-white/15 text-white border-white/25",
  },
};

/**
 * Componente de Mídia Publicitária / Banner Institucional Simulado.
 * Mantém dimensões estáveis para evitar Cumulative Layout Shift (CLS = 0).
 */
export function AdBanner({ banner }: AdBannerProps) {
  const styles = THEME_STYLES[banner.theme];

  if (banner.variant === "leaderboard") {
    return (
      <aside
        aria-label={`Publicidade institucional: ${banner.advertiser}`}
        className="w-full"
      >
        <Link
          href={banner.href}
          className={`group relative flex min-h-[86px] w-full items-center justify-between overflow-hidden rounded-sm ${styles.bg} px-5 py-3 shadow-xs transition-transform hover:brightness-105 sm:px-8`}
        >
          {/* Textura sutil de blocos institucionais */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
              backgroundSize: "36px 24px",
            }}
          />

          <div className="relative z-10 flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
            <span
              className={`inline-flex w-fit items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}
            >
              {banner.badgeText ?? "Espaço Institucional"}
            </span>
            <div>
              <p
                className={`font-display text-xl font-black tracking-tight sm:text-3xl ${styles.accent}`}
              >
                {banner.headline}
              </p>
              {banner.subheadline && (
                <p className="text-xs font-medium text-white/90 sm:text-sm">
                  {banner.subheadline}
                </p>
              )}
            </div>
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-2.5 text-white">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-extrabold uppercase tracking-wider">
                {banner.advertiser}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-white/80">
                {banner.ctaLabel ?? "Saiba mais"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/25 bg-white/10">
              <Building2 className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
          </div>
        </Link>
      </aside>
    );
  }

  return (
    <aside
      aria-label={`Publicidade institucional: ${banner.advertiser}`}
      className="w-full"
    >
      <Link
        href={banner.href}
        className={`group relative flex aspect-[4/3] w-full flex-col items-center justify-between overflow-hidden rounded-sm ${styles.bg} p-6 text-center shadow-xs transition-transform hover:brightness-105`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "42px 32px",
          }}
        />

        <span
          className={`relative z-10 inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}
        >
          {banner.badgeText ?? "Publicidade"}
        </span>

        <div className="relative z-10 my-auto py-3">
          {banner.subheadline && (
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/75">
              {banner.subheadline}
            </p>
          )}
          <p
            className={`font-display text-2xl font-black tracking-tight sm:text-3xl ${styles.accent}`}
          >
            {banner.headline}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-white">
          <Building2 className="h-4 w-4 text-white/90" aria-hidden="true" />
          <span className="text-xs font-extrabold uppercase tracking-wider">
            {banner.advertiser}
          </span>
          <ExternalLink
            className="h-3.5 w-3.5 opacity-75 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </Link>
    </aside>
  );
}

