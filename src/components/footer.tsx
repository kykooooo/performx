import Link from "next/link";
import Logo from "./logo";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-black/40">
      <div className="px-container py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm text-white/70">
              La plateforme qui connecte joueurs, coachs et parents pour des
              séances individuelles et un suivi personnalisé.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
              Plateforme
            </p>
            <nav className="flex flex-col gap-2">
              <Link href="/coach" className="text-sm text-white/70 hover:text-white">
                Trouver un coach
              </Link>
              <Link href="/players" className="text-sm text-white/70 hover:text-white">
                Trouver un joueur
              </Link>
              <Link href="/booking" className="text-sm text-white/70 hover:text-white">
                Réserver une séance
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
              Compte
            </p>
            <nav className="flex flex-col gap-2">
              <Link href="/dashboard" className="text-sm text-white/70 hover:text-white">
                Dashboard
              </Link>
              <Link href="/messages" className="text-sm text-white/70 hover:text-white">
                Messages
              </Link>
              <Link href="/sessions" className="text-sm text-white/70 hover:text-white">
                Mes séances
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
              Inscription
            </p>
            <nav className="flex flex-col gap-2">
              <Link href="/auth/register" className="text-sm text-white/70 hover:text-white">
                Créer un compte
              </Link>
              <Link href="/auth/login" className="text-sm text-white/70 hover:text-white">
                Se connecter
              </Link>
            </nav>
          </div>
        </div>

        {/* ── Certifications ── */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 border-t border-white/10 pt-8">
          {[
            { label: "Formation certifiée", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
            { label: "Paiement sécurisé", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
            { label: "Données protégées", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
          ].map((cert) => (
            <div key={cert.label} className="flex items-center gap-2 text-xs text-white/40">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={cert.icon} />
              </svg>
              {cert.label}
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-xs text-white/50">
            © 2026 PerformX — Tous droits réservés
          </p>

          <nav className="flex flex-wrap items-center gap-4 text-xs text-white/40">
            <Link href="/legal/mentions" className="hover:text-white/70 transition-colors">Mentions légales</Link>
            <Link href="/legal/cgu" className="hover:text-white/70 transition-colors">CGU</Link>
            <Link href="/legal/confidentialite" className="hover:text-white/70 transition-colors">Confidentialité</Link>
            <Link href="/contact" className="hover:text-white/70 transition-colors">Contact</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
