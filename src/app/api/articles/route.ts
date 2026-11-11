import { NextResponse, type NextRequest } from "next/server";
import { revalidatePortalCache } from "@/application/actions/revalidate-portal";
import type { ArticleStatus } from "@/domain/entities/article";
import { createArticleSchema } from "@/domain/validation/schemas";
import { ensureSeeded } from "@/infrastructure/db/seed";
import { articleRepository } from "@/infrastructure/repositories/article-repository";

export async function GET(request: NextRequest) {
  ensureSeeded();
  const { searchParams } = request.nextUrl;

  const statusParam = searchParams.get("status");
  const status: ArticleStatus | "all" =
    statusParam === "all" || statusParam === "draft" || statusParam === "published"
      ? statusParam
      : "published";

  const categorySlug = searchParams.get("categorySlug") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const search = searchParams.get("q") || undefined;
  const isBreakingParam = searchParams.get("isBreaking");
  const isBreaking =
    isBreakingParam === "true"
      ? true
      : isBreakingParam === "false"
        ? false
        : undefined;

  const orderParam = searchParams.get("orderBy");
  const orderBy =
    orderParam === "views" || orderParam === "updatedAt"
      ? orderParam
      : "publishedAt";

  const limitParam = Number(searchParams.get("limit") || "50");
  const offsetParam = Number(searchParams.get("offset") || "0");
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 200)
    : 50;
  const offset = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0;

  const articles = articleRepository.findAll({
    status,
    categorySlug,
    categoryId,
    search,
    isBreaking,
    orderBy,
    limit,
    offset,
  });

  const stats =
    searchParams.get("includeStats") === "true"
      ? articleRepository.getStats()
      : undefined;

  return NextResponse.json({
    articles,
    total: articles.length,
    stats,
  });
}

export async function POST(request: NextRequest) {
  ensureSeeded();
  try {
    const body = await request.json();
    const parsed = createArticleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ?? "Dados da notícia inválidos.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const created = articleRepository.create(parsed.data);
    revalidatePortalCache([
      `/noticia/${created.slug}`,
      `/categoria/${created.categorySlug}`,
    ]);

    return NextResponse.json({ article: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao criar notícia.",
      },
      { status: 400 }
    );
  }
}

