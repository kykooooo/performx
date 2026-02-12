import Link from "next/link";
import AppShell from "@/components/app-shell";
import { BoltIcon } from "@/components/icons";
import PublicStats from "@/components/public-stats";

export default function HomePage() {
  return (
    <AppShell
      active="/"
      title="PerformX"
      description="La plateforme qui connecte les talents du football. Réserve ta séance privée en quelques clics."
    >
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="px-card-strong px-fade-up space-y-6 p-8">
          <div className="flex items-center gap-3">
            <span className="px-badge">Nouveau</span>
            <span className="px-pill">+120 coachs actifs</span>
            <span className="px-pill">Réservation auto</span>
          </div>
          <h2 className="text-4xl text-white">Passe au niveau supérieur.</h2>
          <p className="text-white/70">
            Trouve un coach près de chez toi, réserve une séance individuelle et suis tes progrès dans un agenda dédié.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/coach" className="px-button">
              <BoltIcon className="h-4 w-4" />
              Trouver un coach
            </Link>
            <Link href="/players" className="px-button-ghost">
              Trouver un joueur
            </Link>
            <Link href="/auth/register" className="px-button-ghost">
              Créer un compte
            </Link>
          </div>
          <PublicStats />
        </div>
        <div className="px-card px-fade-up flex flex-col gap-4 p-6" style={{ animationDelay: "120ms" }}>
          <h3 className="text-2xl text-white">Fonctionnalités clés</h3>
          {[
            "Comptes joueurs, coachs et clubs",
            "Paiement direct et instantané",
            "Agenda partagé + notifications",
            "Filtres précis par niveau, distance, spécialité",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="h-2 w-2 rounded-full bg-[color:var(--px-accent)]" />
              <p className="text-sm text-white/70">{item}</p>
            </div>
          ))}
          <div className="px-divider" />
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-4 text-sm text-white/70">
            MVP gratuit aujourd'hui. Supabase + Stripe seront branchés ensuite pour l'auth et le paiement réel.
          </div>
        </div>
      </section>
    </AppShell>
  );
}
