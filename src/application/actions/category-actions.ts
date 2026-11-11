"use server";

import type { ActionResult } from "@/application/actions/article-actions";
import { revalidatePortalCache } from "@/application/actions/revalidate-portal";
import type { Category } from "@/domain/entities/category";
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@/domain/validation/schemas";
import { categoryRepository } from "@/infrastructure/repositories/category-repository";
import { getAdminSessionContext } from "@/infrastructure/supabase/auth-cookies";

export async function createCategoryAction(
  input: CreateCategoryInput
): Promise<ActionResult<Category>> {
  const session = await getAdminSessionContext();
  if (!session.isAdmin) {
    return {
      ok: false,
      error: "Acesso administrativo necessário para criar editorias.",
    };
  }

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
    const created = await categoryRepository.create(
      parsed.data,
      session.accessToken
    );
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
  const session = await getAdminSessionContext();
  if (!session.isAdmin) {
    return {
      ok: false,
      error: "Acesso administrativo necessário para atualizar editorias.",
    };
  }

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
    const updated = await categoryRepository.update(
      parsed.data,
      session.accessToken
    );
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
  const session = await getAdminSessionContext();
  if (!session.isAdmin) {
    return {
      ok: false,
      error: "Acesso administrativo necessário para excluir editorias.",
    };
  }

  if (!id.trim()) {
    return { ok: false, error: "ID da editoria inválido." };
  }

  try {
    const existing = await categoryRepository.findById(id, session.accessToken);
    await categoryRepository.delete(id, session.accessToken);
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
