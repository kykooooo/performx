"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { syncProfile } from "@/lib/profile-sync";

export default function AuthListener() {
  const router = useRouter();
  const pathname = usePathname();

  const redirectByRole = useCallback(async (userId: string, roleHint?: string | null) => {
    let role = roleHint ?? null;
    if (!role) {
      const { data } = await supabase.from("profiles").select("role").eq("user_id", userId).single();
      role = data?.role ?? null;
    }
    switch (role) {
      case "coach":
        router.replace("/dashboard/coach");
        break;
      case "club":
        router.replace("/dashboard/parent");
        break;
      case "player":
      default:
        router.replace("/dashboard/player");
        break;
    }
  }, [router]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (data.user) {
        syncProfile(data.user).catch((err) => console.warn("[PerformX]", err));
        if (pathname.startsWith("/auth/")) {
          const roleHint = (data.user.user_metadata?.role as string | undefined) ?? null;
          redirectByRole(data.user.id, roleHint).catch((err) => console.warn("[PerformX]", err));
        }
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncProfile(session.user).catch((err) => console.warn("[PerformX]", err));
        if (pathname.startsWith("/auth/")) {
          const roleHint = (session.user.user_metadata?.role as string | undefined) ?? null;
          redirectByRole(session.user.id, roleHint).catch((err) => console.warn("[PerformX]", err));
        }
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [pathname, redirectByRole]);

  return null;
}
