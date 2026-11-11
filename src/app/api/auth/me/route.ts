import { NextResponse } from "next/server";
import { getAdminSessionContext } from "@/infrastructure/supabase/auth-cookies";

export async function GET() {
  const session = await getAdminSessionContext();
  if (!session.isAdmin) {
    return NextResponse.json(
      {
        authenticated: session.isAuthenticated,
        isAdmin: false,
        needsDbSetup: session.needsDbSetup,
        user: session.user,
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    isAdmin: true,
    user: session.user,
  });
}

