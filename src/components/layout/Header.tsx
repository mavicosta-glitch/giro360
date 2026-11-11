"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Menu, Search, X } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import {
  MobileDrawer,
  type MenuCategoryItem,
} from "@/components/layout/MobileDrawer";

interface HeaderProps {
  categories: MenuCategoryItem[];
}

/**
 * Cabeçalho Institucional BA Infoco:
 * - Faixa superior branca com Menu Hambúrguer, Logotipo centralizado, Busca e Acesso Admin.
 * - Faixa secundária em Azul-Petróleo (#123B50) com filete Dourado (#D6A843) e rolagem horizontal fluida em mobile.
 */
export function Header({ categories }: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  const activeCategorySlug = pathname.startsWith("/categoria/")
    ? pathname.replace("/categoria/", "").split("/")[0]
    : undefined;

  const isHome = pathname === "/";

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    setSearchOpen(false);
    router.push(`/busca?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-xs">
      {/* Barra Institucional Superior */}
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 sm:px-6">
        {/* Esquerda: Menu Hambúrguer */}
        <div className="flex flex-1 items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu completo de editorias"
            aria-expanded={drawerOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#263746] transition-colors hover:bg-[#EAF0F2] hover:text-[#123B50]"
          >
            <Menu className="h-6 w-6 stroke-[1.8]" aria-hidden="true" />
          </button>
          <span className="hidden text-xs font-medium text-[#263746]/70 md:inline-block">
            Salvador, Bahia • Tempo Real
          </span>
        </div>

        {/* Centro: Logotipo Institucional */}
        <div className="flex shrink-0 items-center justify-center">
          <BrandLogo />
        </div>

        {/* Direita: Busca + Painel Admin */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            aria-label={searchOpen ? "Fechar barra de busca" : "Buscar notícias"}
            aria-expanded={searchOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#263746] transition-colors hover:bg-[#EAF0F2] hover:text-[#123B50]"
          >
            {searchOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Search className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#123B50]/20 bg-[#EAF0F2] px-2.5 py-1.5 text-xs font-bold text-[#123B50] transition-colors hover:border-[#123B50] hover:bg-[#123B50] hover:text-white"
            aria-label="Acessar Painel Administrativo"
          >
            <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Painel Admin</span>
            <span className="sm:hidden">Admin</span>
          </Link>
        </div>
      </div>

      {/* Barra de Busca Expansível */}
      {searchOpen && (
        <div className="border-t border-[#123B50]/10 bg-[#EAF0F2] px-4 py-2.5">
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            aria-label="Pesquisar notícias"
            className="mx-auto flex max-w-[1200px] items-center gap-2"
          >
            <label htmlFor="header-search-input" className="sr-only">
              Pesquisar no portal
            </label>
            <input
              id="header-search-input"
              type="search"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite palavras-chave, assunto ou editoria..."
              className="flex-1 rounded-md border border-[#263746]/25 bg-white px-3 py-2 text-sm text-[#263746] placeholder:text-[#263746]/55 focus:border-[#123B50] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-md bg-[#D6A843] px-4 py-2 text-sm font-extrabold text-[#123B50] transition-colors hover:bg-[#C29534]"
            >
              Buscar
            </button>
          </form>
        </div>
      )}

      {/* Barra de Navegação Secundária em Azul-Petróleo (#123B50) */}
      <nav
        aria-label="Editorias principais"
        className="w-full bg-[#123B50] text-white border-b-2 border-[#D6A843]"
      >
        <div className="mx-auto max-w-[1200px] px-2 sm:px-4">
          <ul className="no-scrollbar flex items-center gap-0.5 overflow-x-auto py-0.5">
            <li className="shrink-0">
              <Link
                href="/"
                aria-current={isHome ? "page" : undefined}
                className={`block whitespace-nowrap px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  isHome
                    ? "bg-[#D6A843] text-[#123B50] font-extrabold"
                    : "text-white/95 hover:bg-[#263746] hover:text-[#D6A843]"
                }`}
              >
                HOME
              </Link>
            </li>
            {categories.map((cat) => {
              const isActive = activeCategorySlug === cat.slug;
              return (
                <li key={cat.id} className="shrink-0">
                  <Link
                    href={`/categoria/${cat.slug}`}
                    aria-current={isActive ? "page" : undefined}
                    className={`block whitespace-nowrap px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                      isActive
                        ? "bg-[#D6A843] text-[#123B50] font-extrabold"
                        : "text-white/95 hover:bg-[#263746] hover:text-[#D6A843]"
                    }`}
                  >
                    {cat.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Drawer Mobile Acessível */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
        activeSlug={activeCategorySlug}
      />
    </header>
  );
}

