import type {
  Article,
  ArticleFilterOptions,
  ArticleStatus,
  CreateArticleDTO,
  UpdateArticleDTO,
} from "@/domain/entities/article";
import {
  createSupabaseAdminClient,
  createSupabasePublicClient,
  isMissingTableError,
  translateSupabaseError,
} from "@/infrastructure/supabase/client";
import { estimateReadingTime, slugify } from "@/lib/formatters";

interface ArticleJoinedRow {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  content: string;
  cover_image: string;
  cover_alt: string;
  image_caption: string;
  category_id: string;
  author_name: string;
  author_role: string;
  status: ArticleStatus;
  is_hero: boolean;
  is_breaking: boolean;
  is_featured: boolean;
  tags: string[] | null;
  views: number;
  reading_time_minutes: number;
  published_at: string;
  created_at: string;
  updated_at: string;
  categories?:
    | {
        id: string;
        name: string;
        slug: string;
        color: string;
      }
    | Array<{
        id: string;
        name: string;
        slug: string;
        color: string;
      }>;
}

function mapRowToArticle(row: ArticleJoinedRow): Article {
  const cat = Array.isArray(row.categories)
    ? row.categories[0]
    : row.categories;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle,
    content: row.content,
    coverImage: row.cover_image,
    coverAlt: row.cover_alt,
    imageCaption: row.image_caption ?? "",
    categoryId: row.category_id,
    categoryName: cat?.name ?? "Geral",
    categorySlug: cat?.slug ?? "geral",
    categoryColor: cat?.color ?? "#05226B",
    authorName: row.author_name,
    authorRole: row.author_role ?? "Redação",
    status: row.status,
    isHero: Boolean(row.is_hero),
    isBreaking: Boolean(row.is_breaking),
    isFeatured: Boolean(row.is_featured),
    tags: Array.isArray(row.tags) ? row.tags : [],
    views: Number(row.views ?? 0),
    readingTimeMinutes: Number(row.reading_time_minutes ?? 1),
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const ARTICLE_SELECT = "*, categories!inner(id, name, slug, color)";

export class ArticleRepository {
  private async ensureUniqueSlug(
    rawSlug: string,
    excludeId?: string,
    accessToken?: string
  ): Promise<string> {
    const client = createSupabaseAdminClient(accessToken);
    const base = slugify(rawSlug) || `noticia-${Date.now()}`;
    let candidate = base;
    let counter = 2;

    while (true) {
      let query = client
        .from("articles")
        .select("id")
        .eq("slug", candidate);

      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      const { data } = await query.maybeSingle();
      if (!data) {
        return candidate;
      }
      candidate = `${base}-${counter}`;
      counter += 1;
    }
  }

  async findAll(
    filters: ArticleFilterOptions = {},
    accessToken?: string
  ): Promise<Article[]> {
    const client = accessToken
      ? createSupabaseAdminClient(accessToken)
      : createSupabasePublicClient();

    let query = client.from("articles").select(ARTICLE_SELECT);

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.categoryId) {
      query = query.eq("category_id", filters.categoryId);
    }
    if (filters.categorySlug) {
      query = query.eq("categories.slug", filters.categorySlug);
    }
    if (typeof filters.isBreaking === "boolean") {
      query = query.eq("is_breaking", filters.isBreaking);
    }
    if (typeof filters.isHero === "boolean") {
      query = query.eq("is_hero", filters.isHero);
    }
    if (typeof filters.isFeatured === "boolean") {
      query = query.eq("is_featured", filters.isFeatured);
    }
    if (filters.search && filters.search.trim()) {
      const sanitized = filters.search.trim().replace(/[,%()]/g, " ");
      query = query.or(
        `title.ilike.%${sanitized}%,subtitle.ilike.%${sanitized}%,content.ilike.%${sanitized}%,author_name.ilike.%${sanitized}%`
      );
    }

    if (filters.orderBy === "views") {
      query = query
        .order("views", { ascending: false })
        .order("published_at", { ascending: false });
    } else if (filters.orderBy === "updatedAt") {
      query = query.order("updated_at", { ascending: false });
    } else {
      query = query
        .order("published_at", { ascending: false })
        .order("created_at", { ascending: false });
    }

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) {
      if (isMissingTableError(error)) return [];
      throw new Error(
        translateSupabaseError(error, "Erro ao carregar notícias.")
      );
    }

    return ((data ?? []) as unknown as ArticleJoinedRow[]).map(mapRowToArticle);
  }

  async findById(id: string, accessToken?: string): Promise<Article | null> {
    const client = accessToken
      ? createSupabaseAdminClient(accessToken)
      : createSupabasePublicClient();

    const { data, error } = await client
      .from("articles")
      .select(ARTICLE_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) return null;
      throw new Error(
        translateSupabaseError(error, "Erro ao buscar notícia por ID.")
      );
    }

    return data ? mapRowToArticle(data as unknown as ArticleJoinedRow) : null;
  }

  async findBySlug(
    slug: string,
    accessToken?: string
  ): Promise<Article | null> {
    const client = accessToken
      ? createSupabaseAdminClient(accessToken)
      : createSupabasePublicClient();

    const { data, error } = await client
      .from("articles")
      .select(ARTICLE_SELECT)
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) return null;
      throw new Error(
        translateSupabaseError(error, "Erro ao buscar notícia por slug.")
      );
    }

    return data ? mapRowToArticle(data as unknown as ArticleJoinedRow) : null;
  }

  async create(
    dto: CreateArticleDTO,
    accessToken?: string
  ): Promise<Article> {
    const client = createSupabaseAdminClient(accessToken);

    const { data: cat } = await client
      .from("categories")
      .select("id")
      .eq("id", dto.categoryId)
      .maybeSingle();

    if (!cat) {
      throw new Error("A categoria selecionada não existe.");
    }

    const slug = await this.ensureUniqueSlug(
      dto.slug || dto.title,
      undefined,
      accessToken
    );
    const readingTimeMinutes = estimateReadingTime(dto.content);
    const publishedAt = dto.publishedAt || new Date().toISOString();

    const { data, error } = await client
      .from("articles")
      .insert({
        title: dto.title.trim(),
        slug,
        subtitle: dto.subtitle.trim(),
        content: dto.content.trim(),
        cover_image: dto.coverImage.trim(),
        cover_alt: dto.coverAlt.trim(),
        image_caption: (dto.imageCaption ?? "").trim(),
        category_id: dto.categoryId,
        author_name: dto.authorName.trim(),
        author_role: (dto.authorRole ?? "Redação").trim(),
        status: dto.status ?? "published",
        is_hero: Boolean(dto.isHero),
        is_breaking: Boolean(dto.isBreaking),
        is_featured: Boolean(dto.isFeatured),
        tags: dto.tags ?? [],
        reading_time_minutes: readingTimeMinutes,
        published_at: publishedAt,
      })
      .select(ARTICLE_SELECT)
      .single();

    if (error || !data) {
      throw new Error(
        translateSupabaseError(error, "Erro ao criar notícia no Supabase.")
      );
    }

    return mapRowToArticle(data as unknown as ArticleJoinedRow);
  }

  async update(
    dto: UpdateArticleDTO,
    accessToken?: string
  ): Promise<Article> {
    const client = createSupabaseAdminClient(accessToken);
    const existing = await this.findById(dto.id, accessToken);
    if (!existing) {
      throw new Error("Notícia não encontrada.");
    }

    if (dto.categoryId) {
      const { data: cat } = await client
        .from("categories")
        .select("id")
        .eq("id", dto.categoryId)
        .maybeSingle();
      if (!cat) {
        throw new Error("Categoria informada não foi encontrada.");
      }
    }

    const nextContent =
      dto.content !== undefined ? dto.content.trim() : existing.content;
    const nextSlug =
      dto.slug !== undefined && dto.slug.trim()
        ? await this.ensureUniqueSlug(dto.slug, dto.id, accessToken)
        : existing.slug;

    const { data, error } = await client
      .from("articles")
      .update({
        title: dto.title !== undefined ? dto.title.trim() : existing.title,
        slug: nextSlug,
        subtitle:
          dto.subtitle !== undefined ? dto.subtitle.trim() : existing.subtitle,
        content: nextContent,
        cover_image:
          dto.coverImage !== undefined
            ? dto.coverImage.trim()
            : existing.coverImage,
        cover_alt:
          dto.coverAlt !== undefined ? dto.coverAlt.trim() : existing.coverAlt,
        image_caption:
          dto.imageCaption !== undefined
            ? dto.imageCaption.trim()
            : existing.imageCaption,
        category_id: dto.categoryId ?? existing.categoryId,
        author_name:
          dto.authorName !== undefined
            ? dto.authorName.trim()
            : existing.authorName,
        author_role:
          dto.authorRole !== undefined
            ? dto.authorRole.trim()
            : existing.authorRole,
        status: dto.status ?? existing.status,
        is_hero: dto.isHero ?? existing.isHero,
        is_breaking: dto.isBreaking ?? existing.isBreaking,
        is_featured: dto.isFeatured ?? existing.isFeatured,
        tags: dto.tags ?? existing.tags,
        reading_time_minutes: estimateReadingTime(nextContent),
        published_at: dto.publishedAt ?? existing.publishedAt,
      })
      .eq("id", dto.id)
      .select(ARTICLE_SELECT)
      .single();

    if (error || !data) {
      throw new Error(
        translateSupabaseError(error, "Erro ao atualizar notícia no Supabase.")
      );
    }

    return mapRowToArticle(data as unknown as ArticleJoinedRow);
  }

  async delete(id: string, accessToken?: string): Promise<void> {
    const client = createSupabaseAdminClient(accessToken);
    const { error } = await client.from("articles").delete().eq("id", id);
    if (error) {
      throw new Error(
        translateSupabaseError(error, "Erro ao excluir notícia.")
      );
    }
  }

  async incrementViewsBySlug(slug: string): Promise<void> {
    const client = createSupabasePublicClient();
    await client.rpc("increment_article_views", { p_slug: slug });
  }

  async getStats(accessToken?: string): Promise<{
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    breakingArticles: number;
    totalViews: number;
    totalCategories: number;
    totalBanners: number;
    totalSubscribers: number;
  }> {
    const client = accessToken
      ? createSupabaseAdminClient(accessToken)
      : createSupabasePublicClient();

    const { data, error } = await client.rpc("get_portal_stats");
    if (!error && data) {
      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        return {
          totalArticles: Number(row.total_articles ?? 0),
          publishedArticles: Number(row.published_articles ?? 0),
          draftArticles: Number(row.draft_articles ?? 0),
          breakingArticles: Number(row.breaking_articles ?? 0),
          totalViews: Number(row.total_views ?? 0),
          totalCategories: Number(row.total_categories ?? 0),
          totalBanners: Number(row.total_banners ?? 0),
          totalSubscribers: Number(row.total_subscribers ?? 0),
        };
      }
    }

    return {
      totalArticles: 0,
      publishedArticles: 0,
      draftArticles: 0,
      breakingArticles: 0,
      totalViews: 0,
      totalCategories: 0,
      totalBanners: 0,
      totalSubscribers: 0,
    };
  }
}

export const articleRepository = new ArticleRepository();
