import type { Article, PortalHomeData } from "@/domain/entities/article";
import type { Category } from "@/domain/entities/category";
import { articleRepository } from "@/infrastructure/repositories/article-repository";
import { bannerRepository } from "@/infrastructure/repositories/banner-repository";
import { categoryRepository } from "@/infrastructure/repositories/category-repository";
import { newsletterRepository } from "@/infrastructure/repositories/newsletter-repository";

export const PORTAL_CACHE_TAG = "portal-content";

export class PortalService {
  async getMenuCategories(): Promise<
    Array<{
      id: string;
      name: string;
      slug: string;
      color: string;
    }>
  > {
    const categories = await categoryRepository.findAll({
      showInMenuOnly: true,
    });
    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      color: cat.color,
    }));
  }

  async getAllCategories(
    includeCounts = true,
    accessToken?: string
  ): Promise<Category[]> {
    return categoryRepository.findAll({ includeCounts }, accessToken);
  }

  async getHomeData(): Promise<PortalHomeData> {
    const [allCategories, published, mostRead, activeBanners] =
      await Promise.all([
        categoryRepository.findAll(),
        articleRepository.findAll({
          status: "published",
          limit: 60,
          orderBy: "publishedAt",
        }),
        articleRepository.findAll({
          status: "published",
          limit: 5,
          orderBy: "views",
        }),
        bannerRepository.findAll({ activeOnly: true }),
      ]);

    const menuCategories = allCategories
      .filter((c) => c.showInMenu)
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        color: c.color,
      }));

    const explicitHero = published.find((item) => item.isHero) ?? null;
    const heroArticle = explicitHero ?? published[0] ?? null;

    const withoutHero = heroArticle
      ? published.filter((item) => item.id !== heroArticle.id)
      : published;

    const explicitFeatured = withoutHero.filter((item) => item.isFeatured);
    const secondaryFeatured =
      explicitFeatured.length >= 2
        ? explicitFeatured.slice(0, 2)
        : [
            ...explicitFeatured,
            ...withoutHero.filter(
              (item) => !explicitFeatured.some((f) => f.id === item.id)
            ),
          ].slice(0, 2);

    const secondaryIds = new Set(secondaryFeatured.map((item) => item.id));
    const latestNews = withoutHero.filter((item) => !secondaryIds.has(item.id));

    const explicitBreaking = published.filter((item) => item.isBreaking);
    const breakingNews =
      explicitBreaking.length > 0 ? explicitBreaking : published.slice(0, 4);

    const featuredCategorySlugs = [
      "bahia",
      "economia",
      "agricultura",
      "cultura",
      "policia",
      "brasil",
    ];
    const categorySections: PortalHomeData["categorySections"] = [];

    for (const slug of featuredCategorySlugs) {
      const cat = allCategories.find((c) => c.slug === slug);
      if (!cat) continue;
      const articles = published
        .filter((item) => item.categoryId === cat.id)
        .slice(0, 3);
      if (articles.length > 0) {
        categorySections.push({
          category: {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            color: cat.color,
          },
          articles,
        });
      }
    }

    const leaderboardBanner =
      activeBanners.find((b) => b.variant === "leaderboard") ?? null;
    const sidebarBanners = activeBanners.filter(
      (b) => b.variant !== "leaderboard"
    );

    return {
      heroArticle,
      secondaryFeatured,
      breakingNews,
      latestNews,
      mostRead,
      categorySections,
      menuCategories,
      leaderboardBanner,
      sidebarBanners,
    };
  }

  async getArticleDetail(
    slug: string,
    incrementView = true
  ): Promise<{
    article: Article;
    related: Article[];
    mostRead: Article[];
    menuCategories: Awaited<ReturnType<PortalService["getMenuCategories"]>>;
    sidebarBanners: Awaited<ReturnType<typeof bannerRepository.findAll>>;
  } | null> {
    const article = await articleRepository.findBySlug(slug);
    if (!article || article.status !== "published") {
      return null;
    }

    if (incrementView) {
      await articleRepository.incrementViewsBySlug(article.slug);
      article.views += 1;
    }

    const [sameCatRaw, recentRaw, mostRead, menuCategories, activeBanners] =
      await Promise.all([
        articleRepository.findAll({
          status: "published",
          categoryId: article.categoryId,
          limit: 5,
        }),
        articleRepository.findAll({ status: "published", limit: 6 }),
        articleRepository.findAll({
          status: "published",
          limit: 5,
          orderBy: "views",
        }),
        this.getMenuCategories(),
        bannerRepository.findAll({ activeOnly: true }),
      ]);

    const sameCategory = sameCatRaw.filter((item) => item.id !== article.id);
    const fallbackRelated =
      sameCategory.length < 3
        ? recentRaw.filter(
            (item) =>
              item.id !== article.id &&
              !sameCategory.some((rel) => rel.id === item.id)
          )
        : [];

    const related = [...sameCategory, ...fallbackRelated].slice(0, 3);
    const sidebarBanners = activeBanners.filter(
      (b) => b.variant !== "leaderboard"
    );

    return {
      article,
      related,
      mostRead,
      menuCategories,
      sidebarBanners,
    };
  }

  async getCategoryPageData(slug: string): Promise<{
    category: Category;
    articles: Article[];
    mostRead: Article[];
    menuCategories: Awaited<ReturnType<PortalService["getMenuCategories"]>>;
    sidebarBanners: Awaited<ReturnType<typeof bannerRepository.findAll>>;
  } | null> {
    const category = await categoryRepository.findBySlug(slug);
    if (!category) return null;

    const [articles, mostRead, menuCategories, activeBanners] =
      await Promise.all([
        articleRepository.findAll({
          status: "published",
          categoryId: category.id,
          limit: 40,
          orderBy: "publishedAt",
        }),
        articleRepository.findAll({
          status: "published",
          limit: 5,
          orderBy: "views",
        }),
        this.getMenuCategories(),
        bannerRepository.findAll({ activeOnly: true }),
      ]);

    return {
      category,
      articles,
      mostRead,
      menuCategories,
      sidebarBanners: activeBanners.filter((b) => b.variant !== "leaderboard"),
    };
  }

  async searchPublishedArticles(
    query: string,
    categorySlug?: string
  ): Promise<Article[]> {
    return articleRepository.findAll({
      status: "published",
      search: query,
      categorySlug: categorySlug || undefined,
      limit: 30,
      orderBy: "publishedAt",
    });
  }

  async getAdminDashboardData(accessToken?: string) {
    const [articles, categories, banners, subscribers, stats] =
      await Promise.all([
        articleRepository.findAll(
          {
            status: "all",
            limit: 200,
            orderBy: "updatedAt",
          },
          accessToken
        ),
        categoryRepository.findAll({ includeCounts: true }, accessToken),
        bannerRepository.findAll(undefined, accessToken),
        newsletterRepository.findAll(accessToken),
        articleRepository.getStats(accessToken),
      ]);

    return {
      articles,
      categories,
      banners,
      subscribers,
      stats,
    };
  }
}

export const portalService = new PortalService();
