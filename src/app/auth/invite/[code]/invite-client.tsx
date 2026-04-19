"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/app-shell";
import { BoltIcon, ShieldIcon, UserIcon } from "@/components/icons";
import { formatLongDate } from "@/lib/date";
import { supabase } from "@/lib/supabase";
import { normalizeUserRole } from "@/lib/roles";

type PreviewRow = {
  parent_name: string | null;
  expires_at: string | null;
  used: boolean | null;
};

export default function InviteClient() {
  const params = useParams();
  const router = useRouter();
  const rawCode = typeof params.code === "string" ? params.code : "";
  const code = rawCode.toUpperCase();

  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<PreviewRow | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [userRole, setUserRole] = useState<ReturnType<typeof normalizeUserRole>>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  const runClaim = useCallback(async () => {
    setClaiming(true);
    setClaimError(null);
    const { error } = await supabase.rpc("claim_parent_invite", { p_code: code });
    setClaiming(false);
    if (error) {
      setClaimError(humanizeClaimError(error.message));
      return;
    }
    setClaimed(true);
  }, [code]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      const [{ data: userData }, previewRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase.rpc("get_parent_invite_preview", { p_code: code }),
      ]);

      if (!mounted) return;

      const previewPayload = Array.isArray(previewRes.data)
        ? (previewRes.data[0] as PreviewRow | undefined)
        : (previewRes.data as PreviewRow | null);

      if (!previewPayload) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPreview(previewPayload);

      if (userData.user) {
        setAuthUserId(userData.user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", userData.user.id)
          .maybeSingle();
        const role = normalizeUserRole(profile?.role ?? null);
        setUserRole(role);
      } else {
        setAuthUserId(null);
        setUserRole(null);
      }

      setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [code]);

  useEffect(() => {
    if (!loading && authUserId && userRole === "player" && !claimed && !claiming && preview && !preview.used) {
      // auto-claim pour un joueur connecté qui arrive sur le lien valide
      runClaim();
    }
  }, [loading, authUserId, userRole, claimed, claiming, preview, runClaim]);

  const expiresLabel = preview?.expires_at
    ? formatLongDate(new Date(preview.expires_at))
    : null;
  const parentName = preview?.parent_name?.trim() || "ton parent";

  return (
    <AppShell active="/" hideTitle>
      <section className="mx-auto max-w-2xl py-12">
        <div className="px-card-strong space-y-6 p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
              <ShieldIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">Invitation</p>
              <h1 className="text-2xl text-white">
                Lie ton compte à celui de <span className="px-gradient-text">{parentName}</span>
              </h1>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-white/70">Chargement du lien...</p>
          ) : notFound ? (
            <div className="space-y-3">
              <p className="text-sm text-white/70">
                Ce lien est invalide ou n&apos;existe plus. Demande à ton parent de t&apos;en générer un nouveau.
              </p>
              <Link href="/" className="px-button-ghost inline-flex">
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : preview?.used ? (
            <div className="space-y-3">
              <p className="text-sm text-white/70">
                Ce lien a déjà été utilisé. Demande un nouveau lien à {parentName} si tu
                as encore besoin de lier ton compte.
              </p>
              <Link href="/dashboard/player" className="px-button inline-flex">
                <BoltIcon className="h-4 w-4" />
                Aller à mon dashboard
              </Link>
            </div>
          ) : claimed ? (
            <div className="space-y-4">
              <p className="rounded-2xl border border-[color:var(--px-success)]/30 bg-[color:var(--px-success)]/10 px-4 py-3 text-sm text-[color:var(--px-success)]">
                Ton compte est maintenant lié à {parentName}. Ton parent verra ta
                progression et tes prochaines séances.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/player" className="px-button">
                  <BoltIcon className="h-4 w-4" />
                  Aller à mon dashboard
                </Link>
                <Link href="/coach" className="px-button-ghost">
                  Explorer les coachs
                </Link>
              </div>
            </div>
          ) : authUserId ? (
            userRole === "player" ? (
              <div className="space-y-4">
                <p className="text-sm text-white/70">
                  Confirme la liaison pour que {parentName} puisse suivre ta progression
                  et tes prochaines séances.
                </p>
                {claimError && (
                  <p className="rounded-xl border border-[color:var(--px-danger)]/40 bg-[color:var(--px-danger)]/10 px-4 py-2 text-xs text-[color:var(--px-danger)]">
                    {claimError}
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={runClaim}
                    disabled={claiming}
                    className="px-button"
                  >
                    <BoltIcon className="h-4 w-4" />
                    {claiming ? "Liaison..." : "Lier mon compte"}
                  </button>
                  <Link href="/dashboard/player" className="px-button-ghost">
                    Plus tard
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-white/70">
                  Ce lien est réservé aux joueurs. Déconnecte-toi puis inscris-toi avec un compte
                  joueur pour accepter l&apos;invitation.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      router.push(`/auth/register/player?invite=${encodeURIComponent(code)}`);
                    }}
                    className="px-button"
                  >
                    Se déconnecter et créer un compte joueur
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-white/70">
                Crée ton compte joueur pour accepter l&apos;invitation. Le lien reste valide
                {expiresLabel ? ` jusqu'au ${expiresLabel}` : ""}.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/auth/register/player?invite=${encodeURIComponent(code)}`}
                  className="px-button"
                >
                  <UserIcon className="h-4 w-4" />
                  Créer un compte joueur
                </Link>
                <Link
                  href={`/auth/login?redirect=${encodeURIComponent(`/auth/invite/${code}`)}`}
                  className="px-button-ghost"
                >
                  J&apos;ai déjà un compte joueur
                </Link>
              </div>
            </div>
          )}

          {!loading && !notFound && expiresLabel && !claimed && !preview?.used && (
            <p className="text-[11px] text-white/50">Code : {code} · Expire le {expiresLabel}</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function humanizeClaimError(message: string) {
  const normalized = message.toUpperCase();
  if (normalized.includes("INVALID_CODE")) return "Lien invalide.";
  if (normalized.includes("CODE_EXPIRED")) return "Ce lien d'invitation a expiré.";
  if (normalized.includes("CODE_ALREADY_USED")) return "Ce lien a déjà été utilisé.";
  if (normalized.includes("PLAYER_ROLE_REQUIRED")) return "Ce lien est réservé aux comptes joueur.";
  if (normalized.includes("AUTH_REQUIRED")) return "Connecte-toi pour accepter l'invitation.";
  return message;
}
