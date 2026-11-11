"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, LayoutDashboard, Search, X, ChevronRight } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";

export interface MenuCategoryItem {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: MenuCategoryItem[];
  activeSlug?: string;
}

export function MobileDrawer({
  isOpen,
  onClose,
  categories,
  activeSlug,
}: MobileDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchInputRef.current?.value.trim() ?? "";
    if (!query) return;
    onClose();
    router.push(`/busca?q=${encodeURIComponent(query)}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navegação de editorias"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#263746]/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside className="relative z-10 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#EAF0F2] px-5 py-4">
          <BrandLogo compact />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar menu de navegação"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#263746] hover:bg-[#EAF0F2] hover:text-[#123B50]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Busca no Drawer */}
        <form
          onSubmit={handleSearchSubmit}
          className="border-b border-[#EAF0F2] px-4 py-3"
          role="search"
          aria-label="Buscar notícias no portal"
        >
          <div className="relative flex items-center">
            <Search
              className="pointer-events-none absolute left-3 h-4 w-4 text-[#263746]/50"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Buscar notícias..."
              aria-label="Termo de busca"
              className="w-full rounded-lg border border-[#123B50]/20 bg-[#EAF0F2] py-2 pl-9 pr-3 text-sm text-[#263746] placeholder:text-[#263746]/55 focus:border-[#123B50] focus:bg-white focus:outline-none"
            />
          </div>
        </form>

        {/* Links de Editorias */}
        <nav
          aria-label="Editorias do portal"
          className="flex-1 overflow-y-auto px-3 py-4"
        >
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#263746]/65">
            Navegação & Editorias
          </p>
          <ul className="space-y-1">
            <li>
              <Link
                href="/"
                onClick={onClose}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  !activeSlug
                    ? "bg-[#123B50] text-[#D6A843]"
                    : "text-[#263746] hover:bg-[#EAF0F2] hover:text-[#123B50]"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Home className="h-4 w-4" aria-hidden="true" />
                  HOME
                </span>
                <ChevronRight className="h-4 w-4 opacity-70" aria-hidden="true" />
              </Link>
            </li>
            {categories.map((cat) => {
              const isActive = activeSlug === cat.slug;
              return (
                <li key={cat.id}>
                  <Link
                    href={`/categoria/${cat.slug}`}
                    onClick={onClose}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-[#123B50] text-[#D6A843]"
                        : "text-[#263746] hover:bg-[#EAF0F2] hover:text-[#123B50]"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                        aria-hidden="true"
                      />
                      <span className="uppercase tracking-wide">{cat.name}</span>
                    </span>
                    <ChevronRight
                      className="h-4 w-4 opacity-60"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Ação Painel Administrativo */}
        <div className="border-t border-[#123B50]/10 bg-[#EAF0F2] p-4">
          <Link
            href="/admin"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#123B50] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#263746]"
          >
            <LayoutDashboard className="h-4 w-4 text-[#D6A843]" aria-hidden="true" />
            Painel Administrativo
          </Link>
        </div>
      </aside>
    </div>
  );
}

