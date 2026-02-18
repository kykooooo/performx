"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="bg-[color:var(--px-bg)] text-white">
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
          <h2 className="text-2xl font-semibold">Une erreur est survenue</h2>
          <p className="text-sm text-white/70">
            L&apos;incident a été remonté automatiquement. Tu peux recharger la page.
          </p>
          <button className="px-button" onClick={reset} type="button">
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
