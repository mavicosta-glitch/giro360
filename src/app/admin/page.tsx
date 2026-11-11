import type { Metadata } from "next";
import { portalService } from "@/application/services/portal-service";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminLoginScreen } from "@/components/admin/AdminLoginScreen";
import { getAdminSessionContext } from "@/infrastructure/supabase/auth-cookies";
import {
  createSupabasePublicClient,
  isMissingTableError,
} from "@/infrastructure/supabase/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel Administrativo",
  description: "Gestão editorial de notícias, editorias e banners no Supabase.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const session = await getAdminSessionContext();

  if (!session.isAdmin) {
    let needsDbSetup = session.needsDbSetup;
    if (!needsDbSetup) {
      const publicClient = createSupabasePublicClient();
      const { error } = await publicClient
        .from("categories")
        .select("id")
        .limit(1);
      needsDbSetup = isMissingTableError(error);
    }

    const pendingRoleMessage =
      session.isAuthenticated && !needsDbSetup
        ? "Sua conta está autenticada, mas ainda não tem papel 'admin' em public.admin_profiles."
        : null;

    return (
      <div id="conteudo-principal">
        <AdminLoginScreen
          needsDbSetup={needsDbSetup}
          pendingRoleMessage={pendingRoleMessage}
        />
      </div>
    );
  }

  const { articles, categories, banners, subscribers, stats } =
    await portalService.getAdminDashboardData(session.accessToken);

  return (
    <div id="conteudo-principal">
      <AdminDashboard
        initialArticles={articles}
        initialCategories={categories}
        initialBanners={banners}
        initialSubscribers={subscribers}
        initialStats={stats}
        adminEmail={session.user?.email}
      />
    </div>
  );
}
