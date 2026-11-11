import { NextResponse, type NextRequest } from "next/server";
import { revalidatePortalCache } from "@/application/actions/revalidate-portal";
import { updateCategorySchema } from "@/domain/validation/schemas";
import { ensureSeeded } from "@/infrastructure/db/seed";
import { categoryRepository } from "@/infrastructure/repositories/category-repository";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  ensureSeeded();
  const { id } = await context.params;
  try {
    const body = await request.json();
    const parsed = updateCategorySchema.safeParse({ ...body, id });
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

    const updated = categoryRepository.update(parsed.data);
    revalidatePortalCache([`/categoria/${updated.slug}`]);
    return NextResponse.json({ category: updated });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar editoria.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  ensureSeeded();
  const { id } = await context.params;
  try {
    const existing = categoryRepository.findById(id);
    categoryRepository.delete(id);
    revalidatePortalCache(existing ? [`/categoria/${existing.slug}`] : []);
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao excluir editoria.",
      },
      { status: 400 }
    );
  }
}

