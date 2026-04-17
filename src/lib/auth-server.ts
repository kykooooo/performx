import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { getDashboardPathForRole, normalizeUserRole } from "./roles";
import type { UserRole } from "./types";

type ServerUser = {
  userId: string;
  role: UserRole | null;
  email: string | null;
};

export async function getServerUser(): Promise<ServerUser | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // lecture seule dans les server components
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const roleRaw =
    profile?.role ?? (user.user_metadata?.role as string | undefined) ?? null;

  return {
    userId: user.id,
    role: normalizeUserRole(roleRaw),
    email: user.email ?? null,
  };
}

export async function requireRole(
  allowed: readonly UserRole[],
): Promise<ServerUser> {
  const user = await getServerUser();
  if (!user) {
    redirect("/auth/login");
  }
  if (!user.role || !allowed.includes(user.role)) {
    // Redirige vers le dashboard correspondant au rôle réel
    redirect(getDashboardPathForRole(user.role ?? "player"));
  }
  return user;
}
