import {
  BellRing,
  Eye,
  FileCheck2,
  FileEdit,
  FolderTree,
  Megaphone,
  Radio,
} from "lucide-react";
import { formatNumberPtBr } from "@/lib/formatters";

export interface AdminStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  breakingArticles: number;
  totalViews: number;
  totalCategories: number;
  totalBanners?: number;
  totalSubscribers?: number;
}

export function AdminStatsCards({ stats }: { stats: AdminStats }) {
  const cards = [
    {
      label: "Publicadas",
      value: formatNumberPtBr(stats.publishedArticles),
      sub: `de ${formatNumberPtBr(stats.totalArticles)} matérias`,
      icon: FileCheck2,
      accent: "text-[#123B50] bg-[#EAF0F2] border-[#123B50]/15",
    },
    {
      label: "Rascunhos",
      value: formatNumberPtBr(stats.draftArticles),
      sub: "aguardando publicação",
      icon: FileEdit,
      accent: "text-[#123B50] bg-[#D6A843]/25 border-[#D6A843]/50",
    },
    {
      label: "No Ticker",
      value: formatNumberPtBr(stats.breakingArticles),
      sub: "manchetes urgentes",
      icon: Radio,
      accent: "text-[#123B50] bg-[#D6A843] border-[#D6A843]",
    },
    {
      label: "Editorias",
      value: formatNumberPtBr(stats.totalCategories),
      sub: `${formatNumberPtBr(stats.totalBanners ?? 0)} banners`,
      icon: FolderTree,
      accent: "text-[#D6A843] bg-[#123B50] border-[#123B50]",
    },
    {
      label: "Inscritos",
      value: formatNumberPtBr(stats.totalSubscribers ?? 0),
      sub: "Plantão BA Infoco",
      icon: BellRing,
      accent: "text-[#263746] bg-[#EAF0F2] border-[#263746]/20",
    },
    {
      label: "Leituras",
      value: formatNumberPtBr(stats.totalViews),
      sub: "visualizações totais",
      icon: Eye,
      accent: "text-white bg-[#263746] border-[#263746]",
    },
  ];

  // Referência explícita para manter import organizado
  void Megaphone;

  return (
    <section
      aria-label="Métricas gerais do portal"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-md border border-[#123B50]/15 bg-white p-4 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#263746]/70">
                {card.label}
              </span>
              <span className={`rounded-md border p-1.5 ${card.accent}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 font-display text-2xl font-black text-[#123B50]">
              {card.value}
            </p>
            <p className="mt-0.5 text-[11px] text-[#263746]/70">{card.sub}</p>
          </div>
        );
      })}
    </section>
  );
}
