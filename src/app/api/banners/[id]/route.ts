import { NextResponse, type NextRequest } from "next/server";
import { revalidatePortalCache } from "@/application/actions/revalidate-portal";
import { updateBannerSchema } from "@/domain/validation/schemas";
import { bannerRepository } from "@/infrastructure/repositories/banner-repository";
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
    const parsed = updateBannerSchema.safeParse({ ...body, id });
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            "Dados para atualização inválidos.",
        },
        { status: 400 }
      );
    }

    const banner = await bannerRepository.update(
      parsed.data,
      session.accessToken
    );
    revalidatePortalCache();
    return NextResponse.json({ banner });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao atualizar banner.",
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
    await bannerRepository.delete(id, session.accessToken);
    revalidatePortalCache();
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao excluir banner.",
      },
      { status: 400 }
    );
  }
}

