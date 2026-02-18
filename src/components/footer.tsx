import Link from "next/link";
import Logo from "./logo";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-black/40">
      <div className="px-container py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm text-white/50">
              Version demo de la plateforme qui connecte joueurs, coachs et parents pour des
              s&eacute;ances individuelles et un suivi personnalis&eacute;.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
              Plateforme
            </p>
            <nav className="flex flex-col gap-2">
              <Link href="/coach" className="text-sm text-white/60 hover:text-white">
                Trouver un coach
              </Link>
              <Link href="/players" className="text-sm text-white/60 hover:text-white">
                Trouver un joueur
              </Link>
              <Link href="/booking" className="text-sm text-white/60 hover:text-white">
                R&eacute;server une s&eacute;ance
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
              Compte
            </p>
            <nav className="flex flex-col gap-2">
              <Link href="/dashboard" className="text-sm text-white/60 hover:text-white">
                Dashboard
              </Link>
              <Link href="/messages" className="text-sm text-white/60 hover:text-white">
                Messages
              </Link>
              <Link href="/sessions" className="text-sm text-white/60 hover:text-white">
                Mes s&eacute;ances
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
              Inscription
            </p>
            <nav className="flex flex-col gap-2">
              <Link href="/auth/register" className="text-sm text-white/60 hover:text-white">
                Cr&eacute;er un compte
              </Link>
              <Link href="/auth/login" className="text-sm text-white/60 hover:text-white">
                Se connecter
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-xs text-white/30">
            &copy; 2025 PerformX. Version de demonstration.
          </p>
          <p className="text-xs text-white/30">
            Built with Next.js + Supabase + Vercel
          </p>
        </div>
      </div>
    </footer>
  );
}
