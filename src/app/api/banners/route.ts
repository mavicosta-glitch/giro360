import { NextResponse, type NextRequest } from "next/server";
import { revalidatePortalCache } from "@/application/actions/revalidate-portal";
import { createBannerSchema } from "@/domain/validation/schemas";
import { bannerRepository } from "@/infrastructure/repositories/banner-repository";
import { getAdminSessionContext } from "@/infrastructure/supabase/auth-cookies";

export async function GET(request: NextRequest) {
  const activeOnly = request.nextUrl.searchParams.get("activeOnly") === "true";
  const session = await getAdminSessionContext();

  if (!activeOnly && !session.isAdmin) {
    return NextResponse.json(
      { error: "Autenticação administrativa necessária." },
      { status: 401 }
    );
  }

  const banners = await bannerRepository.findAll(
    { activeOnly },
    session.isAdmin ? session.accessToken : undefined
  );
  return NextResponse.json({ banners });
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
    const parsed = createBannerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Dados do banner inválidos.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const banner = await bannerRepository.create(
      parsed.data,
      session.accessToken
    );
    revalidatePortalCache();
    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao criar banner.",
      },
      { status: 400 }
    );
  }
}

