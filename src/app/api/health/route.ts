import { NextResponse } from "next/server";
import { articleRepository } from "@/infrastructure/repositories/article-repository";
import {
  createSupabasePublicClient,
  isMissingTableError,
} from "@/infrastructure/supabase/client";

export async function GET() {
  try {
    const client = createSupabasePublicClient();
    const { error } = await client.from("categories").select("id").limit(1);

    if (error && isMissingTableError(error)) {
      return NextResponse.json({
        status: "needs_setup",
        provider: "supabase",
        message: "Execute o script SQL no Supabase SQL Editor para criar as tabelas.",
        timestamp: new Date().toISOString(),
      });
    }
    if (error) {
      throw new Error(error.message || "Erro ao consultar Supabase.");
    }

    const stats = await articleRepository.getStats();
    return NextResponse.json({
      status: "ok",
      provider: "supabase",
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Erro de conexão.",
      },
      { status: 500 }
    );
  }
}
