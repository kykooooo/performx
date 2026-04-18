"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import AppShell from "@/components/app-shell";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <AppShell active="" title="Erreur" description="Une erreur est survenue">
      <section className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[color:var(--px-danger)]/30 bg-[color:var(--px-danger)]/10 text-3xl text-[color:var(--px-danger)]">
          !
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Une erreur est survenue</h2>
          <p className="text-sm text-white/70">
            L&apos;incident a ete remonte automatiquement. Tu peux réessayer ou retourner a
            l&apos;accueil.
          </p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2">
          <button type="button" onClick={reset} className="px-button">
            Reessayer
          </button>
          <Link href="/" className="px-button-ghost text-center">
            Retour a l&apos;accueil
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
