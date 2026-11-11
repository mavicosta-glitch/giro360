import { NextResponse, type NextRequest } from "next/server";
import { revalidatePortalCache } from "@/application/actions/revalidate-portal";
import { createCategorySchema } from "@/domain/validation/schemas";
import { categoryRepository } from "@/infrastructure/repositories/category-repository";
import { getAdminSessionContext } from "@/infrastructure/supabase/auth-cookies";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const showInMenuOnly = searchParams.get("menuOnly") === "true";
  const includeCounts = searchParams.get("includeCounts") !== "false";

  const session = await getAdminSessionContext();
  const categories = await categoryRepository.findAll(
    {
      showInMenuOnly,
      includeCounts,
    },
    session.isAdmin ? session.accessToken : undefined
  );

  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSessionContext();
  if (!session.isAdmin) {
    return NextResponse.json(
      { error: "Autenticação administrativa necessária." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ?? "Dados da editoria inválidos.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const created = await categoryRepository.create(
      parsed.data,
      session.accessToken
    );
    revalidatePortalCache([`/categoria/${created.slug}`]);
    return NextResponse.json({ category: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao criar editoria.",
      },
      { status: 400 }
    );
  }
}
