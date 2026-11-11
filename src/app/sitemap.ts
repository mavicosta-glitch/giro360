import type { MetadataRoute } from "next";
import { portalService } from "@/application/services/portal-service";
import { articleRepository } from "@/infrastructure/repositories/article-repository";
import { SITE_CONFIG } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const categories = portalService.getAllCategories(false);
  const articles = articleRepository.findAll({
    status: "published",
    limit: 500,
    orderBy: "publishedAt",
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_CONFIG.url,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${SITE_CONFIG.url}/busca`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${SITE_CONFIG.url}/categoria/${cat.slug}`,
    lastModified: new Date(cat.updatedAt),
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_CONFIG.url}/noticia/${article.slug}`,
    lastModified: new Date(article.updatedAt),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes];
}

