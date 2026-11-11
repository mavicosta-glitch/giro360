import Link from "next/link";
import { Mail, MapPin, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import type { MenuCategoryItem } from "@/components/layout/MobileDrawer";

interface FooterProps {
  categories: MenuCategoryItem[];
}

export function Footer({ categories }: FooterProps) {
  return (
    <footer className="mt-8 border-t-4 border-[#D6A843] bg-[#263746] text-white">
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Identidade Institucional */}
          <div className="space-y-4 md:col-span-4">
            <BrandLogo inverted />
            <p className="text-xs leading-relaxed text-[#EAF0F2]/90">
              Portal de jornalismo regional e nacional comprometido com a informação em tempo real, apuração responsável e cobertura da Bahia, do Brasil e do mundo.
            </p>
            <div className="space-y-1.5 text-xs text-[#EAF0F2]/85">
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#D6A843]" aria-hidden="true" />
                Salvador, Bahia — Brasil
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#D6A843]" aria-hidden="true" />
                redacao@bainfoco.com.br
              </p>
            </div>
          </div>

          {/* Mapa de Editorias */}
          <div className="md:col-span-5">
            <h2 className="border-b border-[#D6A843]/35 pb-2 font-display text-xs font-extrabold uppercase tracking-wider text-[#D6A843]">
              Editorias
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/categoria/${cat.slug}`}
                    className="text-[#EAF0F2]/90 transition-colors hover:text-[#D6A843] hover:underline"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Institucional & Redação */}
          <div className="md:col-span-3">
            <h2 className="border-b border-[#D6A843]/35 pb-2 font-display text-xs font-extrabold uppercase tracking-wider text-[#D6A843]">
              Portal & Redação
            </h2>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link
                  href="/"
                  className="text-[#EAF0F2]/90 transition-colors hover:text-[#D6A843] hover:underline"
                >
                  Página Inicial
                </Link>
              </li>
              <li>
                <Link
                  href="/busca"
                  className="text-[#EAF0F2]/90 transition-colors hover:text-[#D6A843] hover:underline"
                >
                  Buscar no Arquivo
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 font-semibold text-[#D6A843] hover:underline"
                >
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Painel Administrativo
                </Link>
              </li>
              <li>
                <Link
                  href="/sitemap.xml"
                  className="text-[#EAF0F2]/90 transition-colors hover:text-[#D6A843] hover:underline"
                >
                  Mapa do Site (XML)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/15 pt-6 text-[11px] text-[#EAF0F2]/75 sm:flex-row">
          <p>
            © {new Date().getFullYear()} BA Infoco — Jornalismo Digital de Alta Performance.
          </p>
          <p>
            Arquitetura Next.js App Router • Acessibilidade WCAG AA • Schema.org NewsArticle
          </p>
        </div>
      </div>
    </footer>
  );
}

