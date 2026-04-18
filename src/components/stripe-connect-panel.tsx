"use client";

import { useCallback, useEffect, useState } from "react";
import { BoltIcon, CheckCircleIcon, AlertIcon } from "./icons";

type ConnectStatus = {
  hasAccount: boolean;
  onboarded: boolean;
  detailsSubmitted?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  requirements?: string[];
};

type Props = {
  /** Si true, on refetch le status au mount (utile si l'user revient du onboarding Stripe) */
  refetchOnMount?: boolean;
};

export default function StripeConnectPanel({ refetchOnMount = false }: Props) {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect/status");
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Impossible de vérifier le statut.");
        return;
      }
      const data: ConnectStatus = await res.json();
      setStatus(data);
    } catch {
      setError("Erreur réseau lors de la vérification du statut.");
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus, refetchOnMount]);

  const handleStartOnboarding = async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect/onboard", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Impossible de démarrer l'onboarding Stripe.");
        setStarting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Erreur réseau.");
      setStarting(false);
    }
  };

  // Onboarding complet + prêt à recevoir des paiements
  if (status?.onboarded) {
    return (
      <div className="rounded-2xl border border-[color:var(--px-success)]/30 bg-[color:var(--px-success)]/8 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--px-success)]/15 text-[color:var(--px-success)]">
            <CheckCircleIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Paiements activés</p>
            <p className="mt-1 text-xs text-white/70">
              Tu reçois directement l&apos;argent sur ton compte bancaire quand un joueur réserve
              une séance avec toi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // État "compte créé mais onboarding incomplet" — on propose de reprendre
  if (status?.hasAccount && !status.onboarded) {
    return (
      <div className="rounded-2xl border border-[color:var(--px-warning)]/30 bg-[color:var(--px-warning)]/8 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--px-warning)]/15 text-[color:var(--px-warning)]">
            <AlertIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold text-white">Configuration à finaliser</p>
              <p className="mt-1 text-xs text-white/70">
                Ton compte Stripe est créé mais il manque encore des informations (pièce
                d&apos;identité, IBAN, etc.) pour que tu puisses recevoir des paiements.
              </p>
              {(status.requirements?.length ?? 0) > 0 && (
                <p className="mt-2 text-[11px] text-white/50">
                  Requis : {status.requirements!.slice(0, 3).join(", ")}
                </p>
              )}
            </div>
            <button
              className="px-button text-sm"
              type="button"
              onClick={handleStartOnboarding}
              disabled={starting}
            >
              {starting ? (
                <>
                  <span className="px-spinner mr-2" /> Redirection...
                </>
              ) : (
                <>
                  <BoltIcon className="h-4 w-4" />
                  Terminer la configuration
                </>
              )}
            </button>
            {error && (
              <p className="text-xs text-[color:var(--px-danger)]">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Pas encore de compte Connect : CTA activation
  return (
    <div className="rounded-2xl border border-[color:var(--px-accent)]/30 bg-gradient-to-br from-[color:var(--px-accent)]/12 via-[color:var(--px-accent)]/5 to-transparent p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
          <BoltIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-white">Active tes paiements</p>
            <p className="mt-1 text-xs text-white/70">
              Pour que des joueurs puissent réserver des séances avec toi et que tu reçoives
              l&apos;argent directement sur ton compte bancaire, tu dois connecter ton compte
              Stripe (3-5 min : pièce d&apos;identité + IBAN).
            </p>
            <p className="mt-2 text-[11px] text-white/50">
              PerformX ne prélève aucune commission pendant la phase de test.
            </p>
          </div>
          <button
            className="px-button text-sm"
            type="button"
            onClick={handleStartOnboarding}
            disabled={starting || loadingStatus}
          >
            {starting ? (
              <>
                <span className="px-spinner mr-2" /> Redirection...
              </>
            ) : loadingStatus ? (
              <>
                <span className="px-spinner mr-2" /> Chargement...
              </>
            ) : (
              <>
                <BoltIcon className="h-4 w-4" />
                Activer mes paiements
              </>
            )}
          </button>
          {error && <p className="text-xs text-[color:var(--px-danger)]">{error}</p>}
        </div>
      </div>
    </div>
  );
}
