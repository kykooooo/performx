"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getDashboardPathForRole, normalizeUserRole } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

/**
 * Guard côté client qui vérifie le rôle de l'utilisateur courant et le
 * redirige vers le dashboard correspondant s'il n'a pas le rôle attendu.
 *
 * Usage :
 *   const { status } = useRoleGuard("player");
 *   if (status === "checking") return <Loading />;
 *   // status === "ok" → rendre la page normalement
 *
 * - "checking" : l'appel auth est en cours (tant qu'on ne sait pas, on ne
 *   rend rien de sensible pour éviter un flash visuel).
 * - "ok"       : l'utilisateur a le rôle attendu.
 * - "redirect" : on a enclenché la redirection vers son vrai dashboard.
 */
export function useRoleGuard(expectedRole: UserRole) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ok" | "redirect">("checking");

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      // Pas connecté : le proxy d'auth gère déjà la redirection vers /auth/login
      // pour les routes protégées. Ici on laisse passer.
      if (!user) {
        if (mounted) setStatus("ok");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const role =
        normalizeUserRole(profileData?.role ?? null) ??
        normalizeUserRole((user.user_metadata?.role as string | undefined) ?? null);

      if (!mounted) return;

      if (role && role !== expectedRole) {
        setStatus("redirect");
        router.replace(getDashboardPathForRole(role));
        return;
      }

      setStatus("ok");
    };

    verify();

    return () => {
      mounted = false;
    };
  }, [expectedRole, router]);

  return { status };
}
