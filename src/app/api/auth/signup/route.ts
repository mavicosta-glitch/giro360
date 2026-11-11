import { NextResponse, type NextRequest } from "next/server";
import { adminAuthSchema } from "@/domain/validation/schemas";
import { setAuthCookies } from "@/infrastructure/supabase/auth-cookies";
import {
  createSupabaseAdminClient,
  createSupabasePublicClient,
} from "@/infrastructure/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = adminAuthSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    const publicClient = createSupabasePublicClient();
    const { data, error } = await publicClient.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName?.trim() || "Administrador",
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.session || !data.user) {
      return NextResponse.json(
        {
          requiresEmailConfirmation: true,
          message:
            "Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro (ou confirme o usuário diretamente em Authentication → Users no Supabase) e faça login.",
        },
        { status: 201 }
      );
    }

    const authed = createSupabaseAdminClient(data.session.access_token);
    const { data: profile } = await authed
      .from("admin_profiles")
      .select("role, full_name")
      .eq("id", data.user.id)
      .maybeSingle();

    const response = NextResponse.json(
      {
        requiresEmailConfirmation: false,
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: profile?.full_name || "Administrador",
          role: profile?.role || "pending",
        },
      },
      { status: 201 }
    );

    if (profile?.role === "admin" || profile?.role === "editor") {
      setAuthCookies(
        response,
        data.session.access_token,
        data.session.refresh_token,
        data.session.expires_in
      );
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao cadastrar conta.",
      },
      { status: 500 }
    );
  }
}

