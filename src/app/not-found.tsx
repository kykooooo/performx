import Link from "next/link";
import type { Metadata } from "next";
import AppShell from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Page introuvable",
  description: "La page que tu recherches n'existe pas ou a été déplacée.",
};

export default function NotFound() {
  return (
    <AppShell active="" title="" description="" hideTitle>
      <section className="mx-auto flex w-full max-w-lg flex-col items-center gap-8 py-16 text-center">
        <div className="relative">
          <span className="px-fade-up block text-[120px] font-bold leading-none tracking-tight">
            <span className="px-gradient-text">404</span>
          </span>
          <div
            className="px-fade-up absolute -inset-4 -z-10 rounded-full opacity-30 blur-3xl"
            style={{
              background: "radial-gradient(circle, var(--px-accent), transparent 70%)",
              animationDelay: "100ms",
            }}
          />
        </div>
        <div className="px-fade-up space-y-3" style={{ animationDelay: "120ms" }}>
          <h2 className="text-3xl text-white">Page introuvable</h2>
          <p className="text-sm text-white/70">
            La page que tu recherches n&apos;existe pas ou a été déplacée.
          </p>
        </div>
        <div className="px-fade-up grid w-full gap-3 sm:grid-cols-2" style={{ animationDelay: "240ms" }}>
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
