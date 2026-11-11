import { NextResponse, type NextRequest } from "next/server";
import { newsletterSchema } from "@/domain/validation/schemas";
import { newsletterRepository } from "@/infrastructure/repositories/newsletter-repository";
import { getAdminSessionContext } from "@/infrastructure/supabase/auth-cookies";

export async function GET() {
  const session = await getAdminSessionContext();
  if (!session.isAdmin) {
    return NextResponse.json(
      { error: "Autenticação administrativa necessária." },
      { status: 401 }
    );
  }

  const subscribers = await newsletterRepository.findAll(session.accessToken);
  return NextResponse.json({ subscribers });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "E-mail inválido." },
        { status: 400 }
      );
    }

    const result = await newsletterRepository.subscribe(parsed.data.email);
    return NextResponse.json(
      {
        ok: true,
        alreadySubscribed: result.alreadySubscribed,
        message: result.alreadySubscribed
          ? "Este e-mail já está inscrito no Plantão BA Infoco."
          : "Inscrição confirmada! Obrigado por acompanhar o BA Infoco.",
      },
      { status: result.alreadySubscribed ? 200 : 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao registrar inscrição.",
      },
      { status: 400 }
    );
  }
}

