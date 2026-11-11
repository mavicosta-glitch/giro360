import { portalService } from "@/application/services/portal-service";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreakingNewsTicker } from "@/components/portal/BreakingNewsTicker";
import { JsonLdScript } from "@/components/portal/JsonLdScript";
import { NewsGrid } from "@/components/portal/NewsGrid";
import { buildWebSiteJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const data = portalService.getHomeData();
  const websiteJsonLd = buildWebSiteJsonLd();

  return (
    <>
      <JsonLdScript data={websiteJsonLd} />
      <Header categories={data.menuCategories} />

      <main id="conteudo-principal" className="min-h-screen bg-white">
        <BreakingNewsTicker initialArticles={data.breakingNews} />
        <NewsGrid data={data} />
      </main>

      <Footer categories={data.menuCategories} />
    </>
  );
}

