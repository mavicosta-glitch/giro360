import { NextResponse } from "next/server";
import { ensureSeeded } from "@/infrastructure/db/seed";
import { articleRepository } from "@/infrastructure/repositories/article-repository";

export async function GET() {
  ensureSeeded();
  const stats = articleRepository.getStats();
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    stats,
  });
}

