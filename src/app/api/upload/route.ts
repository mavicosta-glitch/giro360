import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminSessionContext } from "@/infrastructure/supabase/auth-cookies";
import {
  createSupabaseAdminClient,
  translateSupabaseError,
} from "@/infrastructure/supabase/client";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const STORAGE_BUCKET = "news-media";

export async function POST(request: NextRequest) {
  const session = await getAdminSessionContext();
  if (!session.isAdmin) {
    return NextResponse.json(
      { error: "Autenticação administrativa necessária para enviar imagens." },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Nenhum arquivo de imagem enviado." },
        { status: 400 }
      );
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Formato não suportado. Envie JPG, PNG, WebP ou AVIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "A imagem deve ter no máximo 5 MB." },
        { status: 400 }
      );
    }

    const filename = `covers/news-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = createSupabaseAdminClient(session.accessToken);
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          error: translateSupabaseError(
            uploadError,
            "Falha ao enviar imagem para o bucket 'news-media' no Supabase Storage."
          ),
        },
        { status: 400 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);

    return NextResponse.json(
      { url: publicUrl, filename },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao processar upload da imagem.",
      },
      { status: 500 }
    );
  }
}
