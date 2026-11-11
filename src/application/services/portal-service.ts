import type { Article, PortalHomeData } from "@/domain/entities/article";
import type { Category } from "@/domain/entities/category";
import { ensureSeeded } from "@/infrastructure/db/seed";
import { articleRepository } from "@/infrastructure/repositories/article-repository";
import { categoryRepository } from "@/infrastructure/repositories/category-repository";

export const PORTAL_CACHE_TAG = "portal-content";

export class PortalService {
  private init(): void {
    ensureSeeded();
  }

  getMenuCategories(): Array<{
    id: string;
    name: string;
    slug: string;
    color: string;
  }> {
    this.init();
    return categoryRepository
      .findAll({ showInMenuOnly: true })
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        color: cat.color,
      }));
  }

  getAllCategories(includeCounts = true): Category[] {
    this.init();
    return categoryRepository.findAll({ includeCounts });
  }

  getHomeData(): PortalHomeData {
    this.init();
    const menuCategories = this.getMenuCategories();

    const published = articleRepository.findAll({
      status: "published",
      limit: 60,
      orderBy: "publishedAt",
    });

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

    const mostRead = articleRepository.findAll({
      status: "published",
      limit: 5,
      orderBy: "views",
    });

    const featuredCategorySlugs = [
      "bahia",
      "economia",
      "agricultura",
      "cultura",
      "policia",
      "brasil",
    ];
    const allCategories = categoryRepository.findAll();
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

    return {
      heroArticle,
      secondaryFeatured,
      breakingNews,
      latestNews,
      mostRead,
      categorySections,
      menuCategories,
    };
  }

  getArticleDetail(
    slug: string,
    incrementView = true
  ): {
    article: Article;
    related: Article[];
    mostRead: Article[];
    menuCategories: ReturnType<PortalService["getMenuCategories"]>;
  } | null {
    this.init();
    const article = articleRepository.findBySlug(slug);
    if (!article || article.status !== "published") {
      return null;
    }

    if (incrementView) {
      articleRepository.incrementViews(article.id);
      article.views += 1;
    }

    const sameCategory = articleRepository
      .findAll({
        status: "published",
        categoryId: article.categoryId,
        limit: 5,
      })
      .filter((item) => item.id !== article.id);

    const fallbackRelated =
      sameCategory.length < 3
        ? articleRepository
            .findAll({ status: "published", limit: 6 })
            .filter(
              (item) =>
                item.id !== article.id &&
                !sameCategory.some((rel) => rel.id === item.id)
            )
        : [];

    const related = [...sameCategory, ...fallbackRelated].slice(0, 3);

    const mostRead = articleRepository.findAll({
      status: "published",
      limit: 5,
      orderBy: "views",
    });

    return {
      article,
      related,
      mostRead,
      menuCategories: this.getMenuCategories(),
    };
  }

  getCategoryPageData(slug: string): {
    category: Category;
    articles: Article[];
    mostRead: Article[];
    menuCategories: ReturnType<PortalService["getMenuCategories"]>;
  } | null {
    this.init();
    const category = categoryRepository.findBySlug(slug);
    if (!category) return null;

    const articles = articleRepository.findAll({
      status: "published",
      categoryId: category.id,
      limit: 40,
      orderBy: "publishedAt",
    });

    const mostRead = articleRepository.findAll({
      status: "published",
      limit: 5,
      orderBy: "views",
    });

    return {
      category,
      articles,
      mostRead,
      menuCategories: this.getMenuCategories(),
    };
  }

  searchPublishedArticles(query: string, categorySlug?: string): Article[] {
    this.init();
    return articleRepository.findAll({
      status: "published",
      search: query,
      categorySlug: categorySlug || undefined,
      limit: 30,
      orderBy: "publishedAt",
    });
  }

  getAdminDashboardData() {
    this.init();
    const articles = articleRepository.findAll({
      status: "all",
      limit: 200,
      orderBy: "updatedAt",
    });
    const categories = categoryRepository.findAll({ includeCounts: true });
    const stats = articleRepository.getStats();

    return {
      articles,
      categories,
      stats,
    };
  }
}

export const portalService = new PortalService();

