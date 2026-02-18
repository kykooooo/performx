import Link from "next/link";
import AppShell from "@/components/app-shell";
import {
  BoltIcon,
  SearchIcon,
  CalendarIcon,
  CheckCircleIcon,
  QuoteIcon,
  ArrowRightIcon,
  ShieldIcon,
  TrophyIcon,
} from "@/components/icons";
import PublicStats from "@/components/public-stats";
import FeaturedCoaches from "@/components/featured-coaches";
import ScrollReveal from "@/components/scroll-reveal";

const STEPS = [
  {
    number: "01",
    title: "Trouve ton coach",
    description:
      "Parcours notre annuaire de coachs certifiés. Filtre par spécialité, localisation et budget pour trouver le profil idéal.",
    icon: <SearchIcon className="h-6 w-6" />,
  },
  {
    number: "02",
    title: "Réserve un créneau",
    description:
      "Choisis une date et un horaire parmi les disponibilités du coach. Confirmation instantanée, zéro friction.",
    icon: <CalendarIcon className="h-6 w-6" />,
  },
  {
    number: "03",
    title: "Progresse",
    description:
      "Suis tes séances, reçois des retours personnalisés et améliore ton niveau match après match.",
    icon: <BoltIcon className="h-6 w-6" />,
  },
];

const FEATURES = [
  {
    icon: <ShieldIcon className="h-5 w-5" />,
    text: "Comptes joueurs, coachs et parents",
  },
  {
    icon: <CalendarIcon className="h-5 w-5" />,
    text: "Agenda partagé + notifications",
  },
  {
    icon: <CheckCircleIcon className="h-5 w-5" />,
    text: "Réservation instantanée",
  },
  {
    icon: <TrophyIcon className="h-5 w-5" />,
    text: "Filtres par niveau, distance, spécialité",
  },
];

const TESTIMONIALS = [
  {
    name: "Lucas M.",
    role: "Joueur – U17",
    quote:
      "Grâce à PerformX j'ai trouvé un coach spécialisé en technique individuelle à côté de chez moi. En 2 mois mon niveau a explosé.",
  },
  {
    name: "Sophie R.",
    role: "Coach – Spécialiste vitesse",
    quote:
      "La plateforme me permet de gérer mes créneaux facilement et d'avoir une visibilité auprès de nouveaux joueurs. Un vrai gain de temps.",
  },
  {
    name: "Thomas D.",
    role: "Parent d'un joueur U15",
    quote:
      "Je peux suivre les seances, les retours des coachs et reserver rapidement pour mon fils. C'est clair et efficace.",
  },
];

export default function HomePage() {
  return (
    <AppShell active="/" hideTitle>
      {/* ── Hero ── */}
      <section className="relative py-8 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-8">
            <div className="flex items-center gap-3 px-fade-up">
              <span className="px-badge px-pulse">Version demo</span>
              <span className="px-pill">+120 coachs actifs</span>
              <span className="px-pill hidden sm:inline-flex">Réservation instantanée</span>
            </div>

            <h1
              className="px-fade-up text-5xl leading-[1.1] text-white sm:text-6xl lg:text-7xl"
              style={{ animationDelay: "80ms" }}
            >
              Passe au{" "}
              <span className="px-gradient-text">niveau supérieur.</span>
            </h1>

            <p
              className="px-fade-up max-w-xl text-lg text-white/60"
              style={{ animationDelay: "160ms" }}
            >
              Trouve un coach près de chez toi, réserve une séance individuelle en
              quelques clics et suis la progression du joueur dans un espace dédié parents.
            </p>

            <div
              className="px-fade-up flex flex-wrap gap-4"
              style={{ animationDelay: "240ms" }}
            >
              <Link href="/coach" className="px-button text-base px-7 py-4">
                <BoltIcon className="h-5 w-5" />
                Trouver un coach
              </Link>
              <Link href="/players" className="px-button-ghost text-base px-7 py-4">
                Trouver un joueur
              </Link>
              <Link href="/auth/register" className="px-button-ghost text-base px-7 py-4">
                Créer un compte
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>

            <div className="px-fade-up" style={{ animationDelay: "320ms" }}>
              <PublicStats />
            </div>

            <div className="px-fade-up grid gap-3 sm:grid-cols-2 lg:hidden" style={{ animationDelay: "360ms" }}>
              <div className="relative h-32 overflow-hidden rounded-2xl border border-white/10">
                <img
                  src="https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="Ballon de football sur un terrain"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </div>
              <div className="relative h-32 overflow-hidden rounded-2xl border border-white/10">
                <img
                  src="https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="Coach de football donnant des consignes"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </div>
            </div>
          </div>

          <div
            className="px-fade-up hidden flex-col gap-4 lg:flex"
            style={{ animationDelay: "200ms" }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative h-40 overflow-hidden rounded-2xl border border-white/10">
                <img
                  src="https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="Ballon de football sur un terrain"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <p className="absolute bottom-3 left-3 text-xs uppercase tracking-[0.2em] text-white/80">
                  Entrainement individuel
                </p>
              </div>
              <div className="relative h-40 overflow-hidden rounded-2xl border border-white/10">
                <img
                  src="https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="Coach de football donnant des consignes"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <p className="absolute bottom-3 left-3 text-xs uppercase tracking-[0.2em] text-white/80">
                  Coach certifie
                </p>
              </div>
            </div>

            <div className="px-card space-y-4 p-6">
              <h3 className="text-2xl text-white">Fonctionnalités clés</h3>
              {FEATURES.map((feature) => (
                <div
                  key={feature.text}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-all duration-200 hover:border-[color:var(--px-accent)]/20 hover:bg-white/8"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                    {feature.icon}
                  </div>
                  <p className="text-sm text-white/70">{feature.text}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 to-transparent p-4">
              <p className="text-xs text-white/50 leading-relaxed">
                Il s&apos;agit d&apos;une version demo. Les parcours, statistiques et réservations sont
                présentés pour valider l&apos;expérience avant lancement officiel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <ScrollReveal>
        <section className="py-16">
          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.35em] text-white/40">
              <span className="h-[2px] w-10 rounded-full bg-[color:var(--px-accent)]" />
              Comment ça marche
              <span className="h-[2px] w-10 rounded-full bg-[color:var(--px-accent)]" />
            </div>
            <h2 className="text-4xl text-white sm:text-5xl">
              3 étapes, zéro friction.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/50">
              De la recherche à la progression, tout est pensé pour aller vite.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <ScrollReveal key={step.number} delay={index * 120}>
                <div className="group px-card relative overflow-hidden p-6 text-center">
                  <div className="absolute -right-4 -top-4 text-[120px] font-bold leading-none text-white/[0.03] select-none">
                    {step.number}
                  </div>
                  <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)] transition-transform duration-300 group-hover:scale-110">
                    {step.icon}
                  </div>
                  <h3 className="mb-3 text-2xl text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{step.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* ── Fonctionnalités clés (mobile only) ── */}
      <section className="lg:hidden">
        <ScrollReveal>
          <div className="px-card space-y-4 p-6">
            <h3 className="text-2xl text-white">Fonctionnalités clés</h3>
            {FEATURES.map((feature) => (
              <div
                key={feature.text}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                  {feature.icon}
                </div>
                <p className="text-sm text-white/70">{feature.text}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── Coachs vedettes ── */}
      <ScrollReveal>
        <section className="py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/40">
                <span className="h-[2px] w-10 rounded-full bg-[color:var(--px-accent)]" />
                Top coachs
              </div>
              <h2 className="text-4xl text-white sm:text-5xl">Coachs les mieux notés</h2>
            </div>
            <Link
              href="/coach"
              className="px-button-ghost hidden items-center gap-2 md:inline-flex"
            >
              Voir tous les coachs
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <FeaturedCoaches />
          <div className="mt-6 text-center md:hidden">
            <Link href="/coach" className="px-button-ghost inline-flex items-center gap-2">
              Voir tous les coachs
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </ScrollReveal>

      {/* ── Témoignages ── */}
      <ScrollReveal>
        <section className="py-16">
          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.35em] text-white/40">
              <span className="h-[2px] w-10 rounded-full bg-[color:var(--px-accent)]" />
              Témoignages
              <span className="h-[2px] w-10 rounded-full bg-[color:var(--px-accent)]" />
            </div>
            <h2 className="text-4xl text-white sm:text-5xl">
              Ils nous font confiance
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial, index) => (
              <ScrollReveal key={testimonial.name} delay={index * 100}>
                <div className="px-card relative flex flex-col gap-4 p-6">
                  <QuoteIcon className="h-8 w-8 text-[color:var(--px-accent)]/30" />
                  <p className="text-sm leading-relaxed text-white/70">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[color:var(--px-accent)]/15 text-sm font-semibold text-[color:var(--px-accent)]">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                      <p className="text-xs text-white/40">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* ── CTA final ── */}
      <ScrollReveal>
        <section className="py-16">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 p-10 text-center sm:p-16">
            <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--px-accent)]/20 via-transparent to-[color:var(--px-accent-2)]/10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,106,0,0.25),transparent_60%)]" />
            <div className="relative">
              <h2 className="text-4xl text-white sm:text-5xl lg:text-6xl">
                Prêt à passer au{" "}
                <span className="px-gradient-text">niveau supérieur</span> ?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-white/50">
                Version demo en ligne pour valider les usages joueurs, coachs et parents
                avant la mise en production.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link href="/auth/register" className="px-button text-base px-8 py-4">
                  <BoltIcon className="h-5 w-5" />
                  Créer mon compte
                </Link>
                <Link href="/coach" className="px-button-ghost text-base px-8 py-4">
                  Explorer les coachs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </AppShell>
  );
}
