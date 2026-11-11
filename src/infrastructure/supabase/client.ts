import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/infrastructure/supabase/config";

export function createSupabasePublicClient(): SupabaseClient {
  const { url, publishableKey, serviceRoleKey } = getSupabaseConfig();
  return createClient(url, publishableKey || serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Cria cliente Supabase autenticado no servidor:
 * - Usa SUPABASE_SERVICE_ROLE_KEY se configurada no ambiente, OU
 * - Usa o JWT (accessToken) do usuário administrador autenticado via cookies HTTP-only.
 */
export function createSupabaseAdminClient(accessToken?: string): SupabaseClient {
  const { url, publishableKey, serviceRoleKey } = getSupabaseConfig();

  if (serviceRoleKey) {
    return createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

export interface SupabaseLikeError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

export function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as SupabaseLikeError;
  return (
    err.code === "PGRST205" ||
    err.code === "PGRST202" ||
    err.code === "42P01" ||
    err.code === "42883" ||
    (typeof err.message === "string" &&
      (err.message.includes("Could not find the table") ||
        err.message.includes("Could not find the function") ||
        err.message.includes("does not exist")))
  );
}

export function translateSupabaseError(
  error: unknown,
  fallbackMessage: string
): string {
  if (!error || typeof error !== "object") return fallbackMessage;
  const err = error as SupabaseLikeError;

  if (isMissingTableError(err)) {
    return "As tabelas ainda não foram criadas no Supabase. Execute o script SQL no Supabase SQL Editor.";
  }
  if (err.code === "42501") {
    return "Acesso negado pelas políticas RLS do Supabase. Faça login como administrador autorizado.";
  }
  if (err.code === "23505") {
    return "Já existe um registro com esse slug ou e-mail.";
  }
  if (err.code === "23503") {
    return "Não é possível concluir a operação pois existem registros vinculados.";
  }

  return err.message || fallbackMessage;
}

