import { Eye, FileCheck2, FileEdit, FolderTree, Radio } from "lucide-react";
import { formatNumberPtBr } from "@/lib/formatters";

export interface AdminStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  breakingArticles: number;
  totalViews: number;
  totalCategories: number;
}

export function AdminStatsCards({ stats }: { stats: AdminStats }) {
  const cards = [
    {
      label: "Publicadas",
      value: formatNumberPtBr(stats.publishedArticles),
      sub: `de ${formatNumberPtBr(stats.totalArticles)} matérias`,
      icon: FileCheck2,
      accent: "text-[#15803D] bg-emerald-50 border-emerald-200",
    },
    {
      label: "Rascunhos",
      value: formatNumberPtBr(stats.draftArticles),
      sub: "aguardando publicação",
      icon: FileEdit,
      accent: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      label: "No Ticker",
      value: formatNumberPtBr(stats.breakingArticles),
      sub: "manchetes urgentes ativas",
      icon: Radio,
      accent: "text-[#C80A14] bg-red-50 border-red-200",
    },
    {
      label: "Editorias",
      value: formatNumberPtBr(stats.totalCategories),
      sub: "categorias cadastradas",
      icon: FolderTree,
      accent: "text-[#05226B] bg-blue-50 border-blue-200",
    },
    {
      label: "Leituras Totais",
      value: formatNumberPtBr(stats.totalViews),
      sub: "visualizações acumuladas",
      icon: Eye,
      accent: "text-slate-700 bg-slate-100 border-slate-200",
    },
  ];

  return (
    <section
      aria-label="Métricas gerais do portal"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {card.label}
              </span>
              <span className={`rounded-md border p-1.5 ${card.accent}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 font-display text-2xl font-black text-slate-950">
              {card.value}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">{card.sub}</p>
          </div>
        );
      })}
    </section>
  );
}

