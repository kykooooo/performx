import Link from "next/link";
import AppShell from "@/components/app-shell";
import ScrollReveal from "@/components/scroll-reveal";
import {
  WhistleIcon,
  ShieldIcon,
  UserIcon,
  ArrowRightIcon,
  CalendarIcon,
  StarIcon,
  BoltIcon,
} from "@/components/icons";

const DASHBOARD_ITEMS = [
  {
    title: "Dashboard Coach",
    description:
      "Gère tes disponibilités, tes réservations et tes revenus. Visualise ton calendrier et tes séances à venir.",
    href: "/dashboard/coach",
    icon: <WhistleIcon className="h-6 w-6" />,
    primary: true,
    stats: [
      { label: "Séances", value: "12", icon: <CalendarIcon className="h-3.5 w-3.5" /> },
      { label: "Note", value: "4.7", icon: <StarIcon className="h-3.5 w-3.5" /> },
    ],
  },
  {
    title: "Dashboard Parent",
    description:
      "Suivi des joueurs, séances programmées et coachs partenaires. Vue globale pour les parents.",
    href: "/dashboard/club",
    icon: <ShieldIcon className="h-6 w-6" />,
    primary: false,
    stats: [
      { label: "Joueurs", value: "24", icon: <UserIcon className="h-3.5 w-3.5" /> },
      { label: "Coachs", value: "6", icon: <WhistleIcon className="h-3.5 w-3.5" /> },
    ],
  },
  {
    title: "Profil Joueur",
    description:
      "Mets à jour tes infos personnelles, ton avatar et ton profil visible par les coachs.",
    href: "/dashboard/player/profile",
    icon: <UserIcon className="h-6 w-6" />,
    primary: false,
    stats: [],
  },
];

export default function DashboardPage() {
  return (
    <AppShell active="/dashboard" hideTitle>
      {/* ── Hero ── */}
      <section className="py-8 lg:py-12">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-fade-up">
            <span className="px-badge px-pulse">Dashboard</span>
            <span className="px-pill">Espace personnel</span>
          </div>
          <h1
            className="px-fade-up text-4xl leading-[1.1] text-white sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            Mon espace{" "}
            <span className="px-gradient-text">PerformX.</span>
          </h1>
          <p
            className="px-fade-up max-w-lg text-base text-white/60"
            style={{ animationDelay: "160ms" }}
          >
            Choisis ton espace pour piloter tes séances, gérer ton profil et suivre ta progression.
          </p>
        </div>
      </section>

      {/* ── Cards ── */}
      <div className="grid gap-6 md:grid-cols-3">
        {DASHBOARD_ITEMS.map((item, index) => (
          <ScrollReveal key={item.href} delay={index * 80}>
            <div
              className={`${item.primary ? "px-card-strong" : "px-card"} group flex h-full flex-col gap-5 p-6 transition-transform duration-300 hover:translate-y-[-3px]`}
            >
              {/* Icon */}
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)] transition-transform duration-300 group-hover:scale-110">
                {item.icon}
              </div>

              {/* Title */}
              <h3 className="text-2xl text-white">{item.title}</h3>

              {/* Description */}
              <p className="text-sm text-white/60 leading-relaxed">{item.description}</p>

              {/* Mini stats */}
              {item.stats.length > 0 && (
                <div className="flex gap-3">
                  {item.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <span className="text-[color:var(--px-accent)]">{stat.icon}</span>
                      <span className="text-sm font-semibold text-white">{stat.value}</span>
                      <span className="text-[10px] uppercase tracking-wider text-white/40">{stat.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA */}
              <Link
                href={item.href}
                className={`${item.primary ? "px-button" : "px-button-ghost"} mt-auto inline-flex items-center gap-2`}
              >
                {item.primary ? (
                  <>
                    <BoltIcon className="h-4 w-4" />
                    Accéder
                  </>
                ) : (
                  "Ouvrir"
                )}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* ── Quick links ── */}
      <ScrollReveal>
        <section className="py-12">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg text-white">Accès rapide</h3>
                <p className="text-xs text-white/50">Raccourcis vers tes pages les plus utilisées.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/sessions" className="px-button-ghost text-xs">
                  <CalendarIcon className="h-4 w-4" />
                  Mes séances
                </Link>
                <Link href="/messages" className="px-button-ghost text-xs">
                  Messages
                </Link>
                <Link href="/coach" className="px-button-ghost text-xs">
                  Annuaire coachs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </AppShell>
  );
}
