import { NextResponse, type NextRequest } from "next/server";
import { newsletterRepository } from "@/infrastructure/repositories/newsletter-repository";
import { getAdminSessionContext } from "@/infrastructure/supabase/auth-cookies";

interface RouteContext {
  params: Promise<{ id: string }>;
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
    await newsletterRepository.delete(id, session.accessToken);
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao remover inscrito.",
      },
      { status: 400 }
    );
  }
}

