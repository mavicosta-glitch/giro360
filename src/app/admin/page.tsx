import type { Metadata } from "next";
import { portalService } from "@/application/services/portal-service";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel Administrativo",
  description: "Gestão editorial de notícias e editorias do portal BA Infoco.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  const { articles, categories, stats } = portalService.getAdminDashboardData();

  return (
    <div id="conteudo-principal">
      <AdminDashboard
        initialArticles={articles}
        initialCategories={categories}
        initialStats={stats}
      />
    </div>
  );
}

