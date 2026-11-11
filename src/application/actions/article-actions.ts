"use server";

import type { Article } from "@/domain/entities/article";
import {
  createArticleSchema,
  updateArticleSchema,
  type CreateArticleInput,
  type UpdateArticleInput,
} from "@/domain/validation/schemas";
import { revalidatePortalCache } from "@/application/actions/revalidate-portal";
import { ensureSeeded } from "@/infrastructure/db/seed";
import { articleRepository } from "@/infrastructure/repositories/article-repository";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createArticleAction(
  input: CreateArticleInput
): Promise<ActionResult<Article>> {
  ensureSeeded();
  const parsed = createArticleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados da notícia inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const created = articleRepository.create(parsed.data);
    revalidatePortalCache([
      `/noticia/${created.slug}`,
      `/categoria/${created.categorySlug}`,
    ]);
    return { ok: true, data: created };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao criar notícia.",
    };
  }
}

export async function updateArticleAction(
  input: UpdateArticleInput
): Promise<ActionResult<Article>> {
  ensureSeeded();
  const parsed = updateArticleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ?? "Dados para atualização inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const updated = articleRepository.update(parsed.data);
    revalidatePortalCache([
      `/noticia/${updated.slug}`,
      `/categoria/${updated.categorySlug}`,
    ]);
    return { ok: true, data: updated };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao atualizar notícia.",
    };
  }
}

export async function deleteArticleAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  ensureSeeded();
  if (!id.trim()) {
    return { ok: false, error: "ID da notícia inválido." };
  }

  try {
    const existing = articleRepository.findById(id);
    articleRepository.delete(id);
    revalidatePortalCache(
      existing
        ? [`/noticia/${existing.slug}`, `/categoria/${existing.categorySlug}`]
        : []
    );
    return { ok: true, data: { id } };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao excluir notícia.",
    };
  }
}

