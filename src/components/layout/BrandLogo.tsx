import Link from "next/link";

interface BrandLogoProps {
  inverted?: boolean;
  compact?: boolean;
}

/**
 * Logotipo vetorial institucional BA Infoco em SVG inline para carregamento instantâneo (LCP/CLS zero).
 */
export function BrandLogo({ inverted = false, compact = false }: BrandLogoProps) {
  const primaryColor = inverted ? "#FFFFFF" : "#05226B";
  const accentColor = inverted ? "#FF4D58" : "#C80A14";

  return (
    <Link
      href="/"
      aria-label="BA Infoco - Página inicial do portal de notícias"
      className="inline-flex flex-col items-center justify-center leading-none select-none group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C80A14] rounded"
    >
      <span className="relative inline-flex items-center">
        {/* Ícone de foco estilizado integrado ao logotipo */}
        <svg
          width={compact ? 26 : 32}
          height={compact ? 26 : 32}
          viewBox="0 0 36 36"
          aria-hidden="true"
          className="-mr-2.5 z-10 transition-transform duration-200 group-hover:scale-105"
        >
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke={accentColor}
            strokeWidth="3.5"
          />
          <circle
            cx="18"
            cy="18"
            r="8.5"
            fill="none"
            stroke={primaryColor}
            strokeWidth="2.8"
          />
          <circle cx="18" cy="18" r="3.5" fill={accentColor} />
        </svg>
        <span
          className="font-display font-black tracking-tighter"
          style={{
            color: primaryColor,
            fontSize: compact ? "1.65rem" : "2.15rem",
            lineHeight: 0.9,
          }}
        >
          BA
        </span>
      </span>
      <span
        className="font-display font-extrabold uppercase tracking-[0.22em] mt-0.5"
        style={{
          color: accentColor,
          fontSize: compact ? "0.62rem" : "0.75rem",
        }}
      >
        INFOCO
      </span>
    </Link>
  );
}

