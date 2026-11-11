import { NextResponse, type NextRequest } from "next/server";
import { revalidatePortalCache } from "@/application/actions/revalidate-portal";
import { updateArticleSchema } from "@/domain/validation/schemas";
import { ensureSeeded } from "@/infrastructure/db/seed";
import { articleRepository } from "@/infrastructure/repositories/article-repository";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  ensureSeeded();
  const { id } = await context.params;
  const article = articleRepository.findById(id);
  if (!article) {
    return NextResponse.json(
      { error: "Notícia não encontrada." },
      { status: 404 }
    );
  }
  return NextResponse.json({ article });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  ensureSeeded();
  const { id } = await context.params;
  try {
    const body = await request.json();
    const parsed = updateArticleSchema.safeParse({ ...body, id });
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            "Dados para atualização inválidos.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updated = articleRepository.update(parsed.data);
    revalidatePortalCache([
      `/noticia/${updated.slug}`,
      `/categoria/${updated.categorySlug}`,
    ]);
    return NextResponse.json({ article: updated });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar notícia.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  ensureSeeded();
  const { id } = await context.params;
  try {
    const existing = articleRepository.findById(id);
    articleRepository.delete(id);
    revalidatePortalCache(
      existing
        ? [`/noticia/${existing.slug}`, `/categoria/${existing.categorySlug}`]
        : []
    );
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao excluir notícia.",
      },
      { status: 404 }
    );
  }
}

