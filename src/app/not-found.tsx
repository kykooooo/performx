import Link from "next/link";
import type { Metadata } from "next";
import AppShell from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Page introuvable",
  description: "La page que tu recherches n'existe pas ou a été déplacée.",
};

export default function NotFound() {
  return (
    <AppShell active="" title="Page introuvable" description="Erreur 404">
      <section className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-5xl font-bold text-[color:var(--px-accent)]">
          ?
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">Page introuvable</h2>
          <p className="text-sm text-white/60">
            La page que tu recherches n&apos;existe pas ou a été déplacée.
          </p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2">
          <Link href="/" className="px-button">
            Retour à l&apos;accueil
          </Link>
          <Link href="/coach" className="px-button-ghost text-center">
            Voir les coachs
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
