import crypto from "node:crypto";
import type {
  Article,
  ArticleFilterOptions,
  ArticleStatus,
  CreateArticleDTO,
  UpdateArticleDTO,
} from "@/domain/entities/article";
import { getDb } from "@/infrastructure/db/client";
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
  category_name: string;
  category_slug: string;
  category_color: string;
  author_name: string;
  author_role: string;
  status: ArticleStatus;
  is_hero: number;
  is_breaking: number;
  is_featured: number;
  tags: string;
  views: number;
  reading_time_minutes: number;
  published_at: string;
  created_at: string;
  updated_at: string;
}

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function mapRowToArticle(row: ArticleJoinedRow): Article {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle,
    content: row.content,
    coverImage: row.cover_image,
    coverAlt: row.cover_alt,
    imageCaption: row.image_caption,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    categoryColor: row.category_color,
    authorName: row.author_name,
    authorRole: row.author_role,
    status: row.status,
    isHero: Boolean(row.is_hero),
    isBreaking: Boolean(row.is_breaking),
    isFeatured: Boolean(row.is_featured),
    tags: parseTags(row.tags),
    views: Number(row.views),
    readingTimeMinutes: Number(row.reading_time_minutes),
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const BASE_SELECT = `
  SELECT
    a.*,
    c.name AS category_name,
    c.slug AS category_slug,
    c.color AS category_color
  FROM articles a
  INNER JOIN categories c ON c.id = a.category_id
`;

function buildWhereClause(filters: ArticleFilterOptions): {
  sql: string;
  params: Array<string | number>;
} {
  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (filters.status && filters.status !== "all") {
    conditions.push("a.status = ?");
    params.push(filters.status);
  }
  if (filters.categoryId) {
    conditions.push("a.category_id = ?");
    params.push(filters.categoryId);
  }
  if (filters.categorySlug) {
    conditions.push("c.slug = ?");
    params.push(filters.categorySlug);
  }
  if (typeof filters.isBreaking === "boolean") {
    conditions.push("a.is_breaking = ?");
    params.push(filters.isBreaking ? 1 : 0);
  }
  if (typeof filters.isHero === "boolean") {
    conditions.push("a.is_hero = ?");
    params.push(filters.isHero ? 1 : 0);
  }
  if (typeof filters.isFeatured === "boolean") {
    conditions.push("a.is_featured = ?");
    params.push(filters.isFeatured ? 1 : 0);
  }
  if (filters.search && filters.search.trim()) {
    const q = `%${filters.search.trim()}%`;
    conditions.push(
      "(a.title LIKE ? OR a.subtitle LIKE ? OR a.content LIKE ? OR a.tags LIKE ? OR a.author_name LIKE ?)"
    );
    params.push(q, q, q, q, q);
  }

  return {
    sql: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

export class ArticleRepository {
  private ensureUniqueSlug(rawSlug: string, excludeId?: string): string {
    const db = getDb();
    const base = slugify(rawSlug) || `noticia-${Date.now()}`;
    let candidate = base;
    let counter = 2;

    while (true) {
      const existing = excludeId
        ? (db
            .prepare("SELECT id FROM articles WHERE slug = ? AND id != ?")
            .get(candidate, excludeId) as { id: string } | undefined)
        : (db
            .prepare("SELECT id FROM articles WHERE slug = ?")
            .get(candidate) as { id: string } | undefined);

      if (!existing) {
        return candidate;
      }
      candidate = `${base}-${counter}`;
      counter += 1;
    }
  }

  findAll(filters: ArticleFilterOptions = {}): Article[] {
    const db = getDb();
    const { sql, params } = buildWhereClause(filters);

    let orderClause = "ORDER BY a.published_at DESC, a.created_at DESC";
    if (filters.orderBy === "views") {
      orderClause = "ORDER BY a.views DESC, a.published_at DESC";
    } else if (filters.orderBy === "updatedAt") {
      orderClause = "ORDER BY a.updated_at DESC";
    }

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    const query = `
      ${BASE_SELECT}
      ${sql}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const rows = db
      .prepare(query)
      .all(...params, limit, offset) as unknown as ArticleJoinedRow[];

    return rows.map(mapRowToArticle);
  }

  count(filters: ArticleFilterOptions = {}): number {
    const db = getDb();
    const { sql, params } = buildWhereClause(filters);
    const query = `
      SELECT COUNT(*) AS total
      FROM articles a
      INNER JOIN categories c ON c.id = a.category_id
      ${sql}
    `;
    const row = db.prepare(query).get(...params) as { total: number };
    return Number(row.total);
  }

  findById(id: string): Article | null {
    const db = getDb();
    const row = db
      .prepare(`${BASE_SELECT} WHERE a.id = ?`)
      .get(id) as unknown as ArticleJoinedRow | undefined;
    return row ? mapRowToArticle(row) : null;
  }

  findBySlug(slug: string): Article | null {
    const db = getDb();
    const row = db
      .prepare(`${BASE_SELECT} WHERE a.slug = ?`)
      .get(slug) as unknown as ArticleJoinedRow | undefined;
    return row ? mapRowToArticle(row) : null;
  }

  create(dto: CreateArticleDTO): Article {
    const db = getDb();
    const categoryExists = db
      .prepare("SELECT id FROM categories WHERE id = ?")
      .get(dto.categoryId) as { id: string } | undefined;

    if (!categoryExists) {
      throw new Error("A categoria selecionada não existe.");
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const publishedAt = dto.publishedAt || now;
    const slug = this.ensureUniqueSlug(dto.slug || dto.title);
    const readingTimeMinutes = estimateReadingTime(dto.content);
    const isHero = Boolean(dto.isHero);

    db.exec("BEGIN");
    try {
      if (isHero) {
        db.prepare("UPDATE articles SET is_hero = 0 WHERE is_hero = 1").run();
      }

      db.prepare(
        `
        INSERT INTO articles (
          id, title, slug, subtitle, content, cover_image, cover_alt, image_caption,
          category_id, author_name, author_role, status, is_hero, is_breaking, is_featured,
          tags, views, reading_time_minutes, published_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        id,
        dto.title.trim(),
        slug,
        dto.subtitle.trim(),
        dto.content.trim(),
        dto.coverImage.trim(),
        dto.coverAlt.trim(),
        (dto.imageCaption ?? "").trim(),
        dto.categoryId,
        dto.authorName.trim(),
        (dto.authorRole ?? "Redação").trim(),
        dto.status ?? "published",
        isHero ? 1 : 0,
        dto.isBreaking ? 1 : 0,
        dto.isFeatured ? 1 : 0,
        JSON.stringify(dto.tags ?? []),
        0,
        readingTimeMinutes,
        publishedAt,
        now,
        now
      );

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    const created = this.findById(id);
    if (!created) {
      throw new Error("Erro ao recuperar notícia recém-criada.");
    }
    return created;
  }

  update(dto: UpdateArticleDTO): Article {
    const db = getDb();
    const existing = this.findById(dto.id);
    if (!existing) {
      throw new Error("Notícia não encontrada.");
    }

    if (dto.categoryId) {
      const cat = db
        .prepare("SELECT id FROM categories WHERE id = ?")
        .get(dto.categoryId) as { id: string } | undefined;
      if (!cat) {
        throw new Error("Categoria informada não foi encontrada.");
      }
    }

    const nextContent =
      dto.content !== undefined ? dto.content.trim() : existing.content;
    const nextTitle =
      dto.title !== undefined ? dto.title.trim() : existing.title;
    const nextSlug =
      dto.slug !== undefined && dto.slug.trim()
        ? this.ensureUniqueSlug(dto.slug, dto.id)
        : existing.slug;
    const nextReadingTime = estimateReadingTime(nextContent);
    const nextIsHero =
      dto.isHero !== undefined ? dto.isHero : existing.isHero;
    const now = new Date().toISOString();

    db.exec("BEGIN");
    try {
      if (nextIsHero) {
        db.prepare(
          "UPDATE articles SET is_hero = 0 WHERE is_hero = 1 AND id != ?"
        ).run(dto.id);
      }

      db.prepare(
        `
        UPDATE articles
        SET
          title = ?,
          slug = ?,
          subtitle = ?,
          content = ?,
          cover_image = ?,
          cover_alt = ?,
          image_caption = ?,
          category_id = ?,
          author_name = ?,
          author_role = ?,
          status = ?,
          is_hero = ?,
          is_breaking = ?,
          is_featured = ?,
          tags = ?,
          reading_time_minutes = ?,
          published_at = ?,
          updated_at = ?
        WHERE id = ?
      `
      ).run(
        nextTitle,
        nextSlug,
        dto.subtitle !== undefined ? dto.subtitle.trim() : existing.subtitle,
        nextContent,
        dto.coverImage !== undefined
          ? dto.coverImage.trim()
          : existing.coverImage,
        dto.coverAlt !== undefined ? dto.coverAlt.trim() : existing.coverAlt,
        dto.imageCaption !== undefined
          ? dto.imageCaption.trim()
          : existing.imageCaption,
        dto.categoryId ?? existing.categoryId,
        dto.authorName !== undefined
          ? dto.authorName.trim()
          : existing.authorName,
        dto.authorRole !== undefined
          ? dto.authorRole.trim()
          : existing.authorRole,
        dto.status ?? existing.status,
        nextIsHero ? 1 : 0,
        (dto.isBreaking ?? existing.isBreaking) ? 1 : 0,
        (dto.isFeatured ?? existing.isFeatured) ? 1 : 0,
        JSON.stringify(dto.tags ?? existing.tags),
        nextReadingTime,
        dto.publishedAt ?? existing.publishedAt,
        now,
        dto.id
      );

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    const updated = this.findById(dto.id);
    if (!updated) {
      throw new Error("Erro ao carregar notícia atualizada.");
    }
    return updated;
  }

  delete(id: string): void {
    const db = getDb();
    const result = db.prepare("DELETE FROM articles WHERE id = ?").run(id);
    if (result.changes === 0) {
      throw new Error("Notícia não encontrada para exclusão.");
    }
  }

  incrementViews(id: string): void {
    const db = getDb();
    db.prepare("UPDATE articles SET views = views + 1 WHERE id = ?").run(id);
  }

  getStats(): {
    totalArticles: number;
    publishedArticles: number;
    draftArticles: number;
    breakingArticles: number;
    totalViews: number;
    totalCategories: number;
  } {
    const db = getDb();
    const articleStats = db
      .prepare(
        `
        SELECT
          COUNT(*) AS total_articles,
          SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published_articles,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft_articles,
          SUM(CASE WHEN is_breaking = 1 AND status = 'published' THEN 1 ELSE 0 END) AS breaking_articles,
          COALESCE(SUM(views), 0) AS total_views
        FROM articles
      `
      )
      .get() as {
      total_articles: number;
      published_articles: number;
      draft_articles: number;
      breaking_articles: number;
      total_views: number;
    };

    const catStats = db
      .prepare("SELECT COUNT(*) AS total_categories FROM categories")
      .get() as { total_categories: number };

    return {
      totalArticles: Number(articleStats.total_articles ?? 0),
      publishedArticles: Number(articleStats.published_articles ?? 0),
      draftArticles: Number(articleStats.draft_articles ?? 0),
      breakingArticles: Number(articleStats.breaking_articles ?? 0),
      totalViews: Number(articleStats.total_views ?? 0),
      totalCategories: Number(catStats.total_categories ?? 0),
    };
  }
}

export const articleRepository = new ArticleRepository();

