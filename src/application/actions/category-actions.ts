"use server";

import type { Category } from "@/domain/entities/category";
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@/domain/validation/schemas";
import type { ActionResult } from "@/application/actions/article-actions";
import { revalidatePortalCache } from "@/application/actions/revalidate-portal";
import { ensureSeeded } from "@/infrastructure/db/seed";
import { categoryRepository } from "@/infrastructure/repositories/category-repository";

export async function createCategoryAction(
  input: CreateCategoryInput
): Promise<ActionResult<Category>> {
  ensureSeeded();
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ?? "Dados da editoria inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const created = categoryRepository.create(parsed.data);
    revalidatePortalCache([`/categoria/${created.slug}`]);
    return { ok: true, data: created };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao criar editoria.",
    };
  }
}

export async function updateCategoryAction(
  input: UpdateCategoryInput
): Promise<ActionResult<Category>> {
  ensureSeeded();
  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ?? "Dados para atualização inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const updated = categoryRepository.update(parsed.data);
    revalidatePortalCache([`/categoria/${updated.slug}`]);
    return { ok: true, data: updated };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao atualizar editoria.",
    };
  }
}

export async function deleteCategoryAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  ensureSeeded();
  if (!id.trim()) {
    return { ok: false, error: "ID da editoria inválido." };
  }

  try {
    const existing = categoryRepository.findById(id);
    categoryRepository.delete(id);
    revalidatePortalCache(
      existing ? [`/categoria/${existing.slug}`] : []
    );
    return { ok: true, data: { id } };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao excluir editoria.",
    };
  }
}

