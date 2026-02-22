import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/auth-shell";

export const metadata: Metadata = {
  title: "Inscription",
  description: "Crée ton compte PerformX en tant que joueur ou coach.",
};

export default function RegisterChoicePage() {
  return (
    <AuthShell title="Créer un compte" subtitle="Choisis ton profil pour commencer.">
      <div className="grid gap-4">
        <div className="px-card p-5">
          <h3 className="text-xl text-white">Je suis joueur</h3>
          <p className="mt-2 text-sm text-white/60">Accède aux coachs et réserve tes séances.</p>
          <Link href="/auth/register/player" className="px-button mt-4 w-full">
            Créer un compte joueur
          </Link>
        </div>
        <div className="px-card p-5">
          <h3 className="text-xl text-white">Je suis coach</h3>
          <p className="mt-2 text-sm text-white/60">Propose tes disponibilités et reçois des réservations.</p>
          <Link href="/auth/register/coach" className="px-button mt-4 w-full">
            Créer un compte coach
          </Link>
        </div>
        <p className="text-center text-xs text-white/60">
          Déjà un compte ? <Link className="text-[color:var(--px-accent)]" href="/auth/login">Se connecter</Link>
        </p>
      </div>
    </AuthShell>
  );
}
