import { NextResponse, type NextRequest } from "next/server";
import { revalidatePortalCache } from "@/application/actions/revalidate-portal";
import { updateCategorySchema } from "@/domain/validation/schemas";
import { categoryRepository } from "@/infrastructure/repositories/category-repository";
import { getAdminSessionContext } from "@/infrastructure/supabase/auth-cookies";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getAdminSessionContext();
  if (!session.isAdmin) {
    return NextResponse.json(
      { error: "Autenticação administrativa necessária." },
      { status: 401 }
    );
  }

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

    const updated = await categoryRepository.update(
      parsed.data,
      session.accessToken
    );
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
  const session = await getAdminSessionContext();
  if (!session.isAdmin) {
    return NextResponse.json(
      { error: "Autenticação administrativa necessária." },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  try {
    const existing = await categoryRepository.findById(id, session.accessToken);
    await categoryRepository.delete(id, session.accessToken);
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
