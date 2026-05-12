"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getDashboardPathForRole, normalizeUserRole } from "@/lib/roles";
import { supabase } from "@/lib/supabase";
import { syncProfile } from "@/lib/profile-sync";

export default function AuthListener() {
  const router = useRouter();
  const pathname = usePathname();

  const redirectByRole = useCallback(async (userId: string, roleHint?: string | null) => {
    let role = normalizeUserRole(roleHint);
    if (!role) {
      const { data } = await supabase.from("profiles").select("role").eq("user_id", userId).single();
      role = normalizeUserRole(data?.role ?? null);
    }
    router.replace(getDashboardPathForRole(role));
  }, [router]);

  useEffect(() => {
    let mounted = true;

    // Wrappe TOUT dans try/catch pour éviter qu'une erreur ici (storage
    // bloqué sur Safari Private mode, cookies désactivés, etc.) ne crash
    // le composant et déclenche l'error boundary sur toute la page.
    try {
      supabase.auth
        .getUser()
        .then(({ data }) => {
          if (!mounted) return;
          if (data.user) {
            syncProfile(data.user).catch((err) => console.warn("[PerformX]", err));
            if (pathname.startsWith("/auth/")) {
              const roleHint = (data.user.user_metadata?.role as string | undefined) ?? null;
              redirectByRole(data.user.id, roleHint).catch((err) =>
                console.warn("[PerformX]", err),
              );
            }
          }
        })
        .catch((err) => console.warn("[PerformX] auth.getUser failed:", err));

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          syncProfile(session.user).catch((err) => console.warn("[PerformX]", err));
          if (pathname.startsWith("/auth/")) {
            const roleHint = (session.user.user_metadata?.role as string | undefined) ?? null;
            redirectByRole(session.user.id, roleHint).catch((err) =>
              console.warn("[PerformX]", err),
            );
          }
        }
      });

      return () => {
        mounted = false;
        try {
          data.subscription.unsubscribe();
        } catch {
          // ignore cleanup errors
        }
      };
    } catch (err) {
      console.warn("[PerformX] AuthListener init failed:", err);
      return () => {
        mounted = false;
      };
    }
  }, [pathname, redirectByRole]);

  return null;
}
