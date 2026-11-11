import { NextResponse, type NextRequest } from "next/server";
import { revalidatePortalCache } from "@/application/actions/revalidate-portal";
import { createCategorySchema } from "@/domain/validation/schemas";
import { ensureSeeded } from "@/infrastructure/db/seed";
import { categoryRepository } from "@/infrastructure/repositories/category-repository";

export async function GET(request: NextRequest) {
  ensureSeeded();
  const { searchParams } = request.nextUrl;
  const showInMenuOnly = searchParams.get("menuOnly") === "true";
  const includeCounts = searchParams.get("includeCounts") !== "false";

  const categories = categoryRepository.findAll({
    showInMenuOnly,
    includeCounts,
  });

  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  ensureSeeded();
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

    const created = categoryRepository.create(parsed.data);
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

