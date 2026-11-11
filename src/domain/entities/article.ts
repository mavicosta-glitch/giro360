export type ArticleStatus = "published" | "draft";

/**
 * Entidade de domínio principal para Notícias / Matérias Editoriais.
 */
export interface Article {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  content: string;
  coverImage: string;
  coverAlt: string;
  imageCaption: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  categoryColor: string;
  authorName: string;
  authorRole: string;
  status: ArticleStatus;
  isHero: boolean;
  isBreaking: boolean;
  isFeatured: boolean;
  tags: string[];
  views: number;
  readingTimeMinutes: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticleDTO {
  title: string;
  slug?: string;
  subtitle: string;
  content: string;
  coverImage: string;
  coverAlt: string;
  imageCaption?: string;
  categoryId: string;
  authorName: string;
  authorRole?: string;
  status?: ArticleStatus;
  isHero?: boolean;
  isBreaking?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  publishedAt?: string;
}

export interface UpdateArticleDTO extends Partial<CreateArticleDTO> {
  id: string;
}

export interface ArticleFilterOptions {
  status?: ArticleStatus | "all";
  categorySlug?: string;
  categoryId?: string;
  search?: string;
  isBreaking?: boolean;
  isHero?: boolean;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: "publishedAt" | "views" | "updatedAt";
}

export interface PortalHomeData {
  heroArticle: Article | null;
  secondaryFeatured: Article[];
  breakingNews: Article[];
  latestNews: Article[];
  mostRead: Article[];
  categorySections: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
      color: string;
    };
    articles: Article[];
  }>;
  menuCategories: Array<{
    id: string;
    name: string;
    slug: string;
    color: string;
  }>;
}

