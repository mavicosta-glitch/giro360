import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabasePublicClient,
  isMissingTableError,
} from "@/infrastructure/supabase/client";
import { getSupabaseConfig } from "@/infrastructure/supabase/config";

export const ACCESS_COOKIE = "ba_admin_access_token";
export const REFRESH_COOKIE = "ba_admin_refresh_token";

export interface AdminUserSession {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "editor" | "pending";
}

export interface AdminSessionContext {
  isAuthenticated: boolean;
  isAdmin: boolean;
  needsDbSetup: boolean;
  accessToken?: string;
  user: AdminUserSession | null;
}

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  expiresIn = 3600
): void {
  const isProd = process.env.NODE_ENV === "production";
  response.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: Math.max(expiresIn, 3600),
  });
  response.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
}

export async function getAdminSessionContext(): Promise<AdminSessionContext> {
  const { hasServiceRole } = getSupabaseConfig();
  if (hasServiceRole) {
    return {
      isAuthenticated: true,
      isAdmin: true,
      needsDbSetup: false,
      user: {
        id: "service-role",
        email: "admin@bainfoco.com.br",
        fullName: "Administrador (Service Role)",
        role: "admin",
      },
    };
  }

  const cookieStore = await cookies();
  let accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      needsDbSetup: false,
      user: null,
    };
  }

  const publicClient = createSupabasePublicClient();
  let authUser = null;

  if (accessToken) {
    const { data, error } = await publicClient.auth.getUser(accessToken);
    if (!error && data.user) {
      authUser = data.user;
    }
  }

  if (!authUser && refreshToken) {
    const { data, error } = await publicClient.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (!error && data.session && data.user) {
      accessToken = data.session.access_token;
      authUser = data.user;
    }
  }

  if (!authUser || !accessToken) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      needsDbSetup: false,
      user: null,
    };
  }

  const authedClient = createSupabaseAdminClient(accessToken);
  const { data: profile, error: profileError } = await authedClient
    .from("admin_profiles")
    .select("id, email, full_name, role")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError) {
    if (isMissingTableError(profileError)) {
      return {
        isAuthenticated: true,
        isAdmin: false,
        needsDbSetup: true,
        accessToken,
        user: {
          id: authUser.id,
          email: authUser.email ?? "",
          fullName:
            (authUser.user_metadata?.full_name as string | undefined) ||
            "Usuário",
          role: "pending",
        },
      };
    }

    return {
      isAuthenticated: true,
      isAdmin: false,
      needsDbSetup: false,
      accessToken,
      user: {
        id: authUser.id,
        email: authUser.email ?? "",
        fullName:
          (authUser.user_metadata?.full_name as string | undefined) ||
          "Usuário",
        role: "pending",
      },
    };
  }

  const role =
    profile?.role === "admin" || profile?.role === "editor"
      ? profile.role
      : "pending";

  return {
    isAuthenticated: true,
    isAdmin: role === "admin" || role === "editor",
    needsDbSetup: false,
    accessToken,
    user: {
      id: authUser.id,
      email: profile?.email ?? authUser.email ?? "",
      fullName:
        profile?.full_name ||
        (authUser.user_metadata?.full_name as string | undefined) ||
        authUser.email ||
        "Administrador",
      role,
    },
  };
}

