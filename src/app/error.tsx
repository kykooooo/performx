"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import AppShell from "@/components/app-shell";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Sentry.captureException(error);
    // Log très visible en console pour le debug à distance (Safari iOS,
    // Web Inspector, etc.). Évite de devoir cliquer "Détails techniques".
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.error("[PerformX error.tsx]", {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        url: window.location.href,
        ua: navigator.userAgent,
      });
    }
  }, [error]);

  // Construit un texte de diagnostic copiable contenant tout ce qui peut aider
  // à reproduire le bug : page, user-agent, message, stack et digest Sentry.
  const diagnostic = (() => {
    const parts: string[] = [];
    if (typeof window !== "undefined") {
      parts.push(`URL: ${window.location.href}`);
      parts.push(`UA: ${navigator.userAgent}`);
    }
    parts.push(`Message: ${error.message || "(aucun message)"}`);
    if (error.digest) parts.push(`Digest: ${error.digest}`);
    if (error.stack) parts.push(`Stack:\n${error.stack}`);
    return parts.join("\n");
  })();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(diagnostic);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API non supportée (Safari < 13.4 ou contexte non sécurisé)
    }
  };

  return (
    <AppShell active="" title="Erreur" description="Une erreur est survenue">
      <section className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[color:var(--px-danger)]/30 bg-[color:var(--px-danger)]/10 text-3xl text-[color:var(--px-danger)]">
          !
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Une erreur est survenue</h2>
          <p className="text-sm text-white/70">
            L&apos;incident a été remonté automatiquement. Tu peux réessayer ou retourner à
            l&apos;accueil.
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-white/40">
              Code : {error.digest}
            </p>
          )}
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2">
          <button type="button" onClick={reset} className="px-button">
            Réessayer
          </button>
          <Link href="/" className="px-button-ghost text-center">
            Retour à l&apos;accueil
          </Link>
        </div>

        {/* Bloc diagnostic — déplié à la demande, copiable. Aide le support
            à reproduire le bug quand un user remonte un problème. */}
        <details
          className="w-full rounded-xl border border-white/10 bg-white/5 text-left text-xs"
          open={showDetails}
          onToggle={(e) => setShowDetails((e.target as HTMLDetailsElement).open)}
        >
          <summary className="cursor-pointer px-4 py-3 font-medium text-white/70 hover:text-white">
            Détails techniques (à envoyer au support)
          </summary>
          <div className="border-t border-white/10 px-4 py-3 space-y-3">
            <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-black/50 p-3 font-mono text-[10px] text-white/80">
              {diagnostic}
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              className="px-button-ghost w-full text-xs"
            >
              {copied ? "✓ Copié" : "Copier les détails"}
            </button>
          </div>
        </details>
      </section>
    </AppShell>
  );
}
