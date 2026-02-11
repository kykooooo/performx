import Link from "next/link";
import AppShell from "@/components/app-shell";

export default function DashboardPage() {
  return (
    <AppShell
      active="/dashboard"
      title="Dashboard PerformX"
      description="Choisis ton espace pour piloter tes séances et tes clients."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <div className="px-card-strong p-6">
          <h3 className="text-2xl text-white">Dashboard Coach</h3>
          <p className="mt-2 text-sm text-white/60">
            Gère tes disponibilités, tes réservations et tes revenus.
          </p>
          <Link href="/dashboard/coach" className="px-button mt-6">
            Accéder
          </Link>
        </div>
        <div className="px-card p-6">
          <h3 className="text-2xl text-white">Dashboard Club</h3>
          <p className="mt-2 text-sm text-white/60">
            Suivi des joueurs, sessions collectives et coachs partenaires.
          </p>
          <Link href="/dashboard/club" className="px-button-ghost mt-6">
            Accéder
          </Link>
        </div>
        <div className="px-card p-6">
          <h3 className="text-2xl text-white">Profil Joueur</h3>
          <p className="mt-2 text-sm text-white/60">
            Mets à jour tes infos personnelles et ton profil.
          </p>
          <Link href="/dashboard/player/profile" className="px-button-ghost mt-6">
            Modifier
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
