export function getSupabaseConfig() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    "https://rhxnyrcwsvnszxjrgxxp.supabase.co";

  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "sb_publishable_xq6nsMZMX-YvWOxmGJS_bg_ZrZ2Xv6J";

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

  if (!publishableKey && !serviceRoleKey) {
    throw new Error(
      "Variável NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY não configurada."
    );
  }

  return {
    url,
    publishableKey,
    serviceRoleKey,
    hasServiceRole: Boolean(serviceRoleKey),
  };
}

