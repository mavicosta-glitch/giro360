import { NextResponse, type NextRequest } from "next/server";
import { adminAuthSchema } from "@/domain/validation/schemas";
import { setAuthCookies } from "@/infrastructure/supabase/auth-cookies";
import {
  createSupabaseAdminClient,
  createSupabasePublicClient,
  isMissingTableError,
  translateSupabaseError,
} from "@/infrastructure/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = adminAuthSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Credenciais inválidas." },
        { status: 400 }
      );
    }

    const publicClient = createSupabasePublicClient();
    const { data, error } = await publicClient.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.session || !data.user) {
      return NextResponse.json(
        {
          error:
            error?.message === "Email not confirmed"
              ? "E-mail ainda não confirmado. Verifique sua caixa de entrada ou confirme o usuário no painel do Supabase."
              : "E-mail ou senha incorretos.",
        },
        { status: 401 }
      );
    }

    const authed = createSupabaseAdminClient(data.session.access_token);
    const { data: profile, error: profileError } = await authed
      .from("admin_profiles")
      .select("role, full_name")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      if (isMissingTableError(profileError)) {
        return NextResponse.json(
          {
            error:
              "Tabela admin_profiles não encontrada. Execute o script SQL no Supabase SQL Editor primeiro.",
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        {
          error: translateSupabaseError(
            profileError,
            "Erro ao verificar perfil administrativo."
          ),
        },
        { status: 403 }
      );
    }

    if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
      return NextResponse.json(
        {
          error:
            "Sua conta ainda não possui permissão de administrador. Promova este usuário para 'admin' na tabela public.admin_profiles no Supabase.",
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: profile.full_name || data.user.email,
        role: profile.role,
      },
    });

    setAuthCookies(
      response,
      data.session.access_token,
      data.session.refresh_token,
      data.session.expires_in
    );

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao autenticar.",
      },
      { status: 500 }
    );
  }
}

