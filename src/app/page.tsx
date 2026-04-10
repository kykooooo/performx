import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import AppShell from "@/components/app-shell";
import JsonLd from "@/components/json-ld";
import {
  BoltIcon,
  SearchIcon,
  CalendarIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ShieldIcon,
  TrophyIcon,
  StarIcon,
  UsersIcon,
} from "@/components/icons";
import { SITE_URL } from "@/lib/constants";
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
    name: "Lucas, 16 ans",
    role: "U17 · FC Rouen",
    quote:
      "Depuis 3 mois avec coach Amina, ma frappe enroulée est devenue mon arme secrète. Elle m'a fait travailler le placement du pied d'appui et ça a tout changé. Mon entraîneur en club a remarqué la diff.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas&backgroundColor=c0aede",
    badge: "Membre depuis 3 mois",
    rating: 5,
  },
  {
    name: "Sophie Renaud",
    role: "Coach certifiée UEFA B",
    quote:
      "En 4 mois sur PerformX, j'ai rempli 80% de mes créneaux sans prospecter. La gestion du planning est fluide et les joueurs arrivent motivés. Je me concentre sur ce que je sais faire : coacher.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie&backgroundColor=ffd5dc",
    badge: "Coach vérifiée ✓",
    rating: 0,
  },
  {
    name: "Thomas, papa de Maxime",
    role: "Parent · U15 Dieppe",
    quote:
      "Je vois les séances de Maxime, je lis les retours du coach après chaque entraînement. C'est rassurant de savoir exactement ce qu'il travaille et comment il progresse. La réservation prend 30 secondes.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas&backgroundColor=b6e3f4",
    badge: "Parent depuis 6 mois",
    rating: 0,
  },
];

const IMMERSIVE_GALLERY = [
  {
    src: "https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Footballeur en action pendant un entraînement",
    label: "Travail technique",
  },
  {
    src: "https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Coach qui dirige une séance terrain",
    label: "Coaching personnalisé",
  },
  {
    src: "https://images.pexels.com/photos/918798/pexels-photo-918798.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Joueurs de football en préparation avant séance",
    label: "Suivi des progrès",
  },
];

const PARENT_BENEFITS = [
  {
    title: "Suivi simple",
    text: "Visualisez les séances réservées, terminées et les prochaines étapes depuis un seul espace.",
  },
  {
    title: "Paiement clair",
    text: "Montants, coach et horaires validés avant confirmation pour éviter les surprises.",
  },
  {
    title: "Communication directe",
    text: "Messagerie intégrée avec le coach pour préparer la séance et suivre le débrief.",
  },
];

export const metadata: Metadata = {
  title: "PerformX | Coaching Football Individuel – Trouve ton coach",
  description:
    "Réserve des séances de coaching football individuel avec des coachs certifiés. Progresse rapidement avec PerformX.",
};

export default function HomePage() {
  return (
    <AppShell active="/" hideTitle>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "PerformX",
          url: SITE_URL,
          description:
            "Plateforme de coaching football individuel. Trouve ton coach, réserve une séance privée.",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${SITE_URL}/coach?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      {/* ── Hero ── */}
      <section className="px-hero-bg relative -mx-4 rounded-3xl px-4 py-8 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-8">
            <div className="flex items-center gap-3 px-fade-up">
              <span className="px-badge px-pulse">PerformX</span>
              <span className="px-pill">Coachs certifies</span>
              <span className="px-pill hidden sm:inline-flex">Réservation instantanée</span>
            </div>

            <h1
              className="px-fade-up text-5xl leading-[1.1] text-white sm:text-6xl lg:text-7xl"
              style={{ animationDelay: "80ms" }}
            >
              Le bon coach
              <span className="block px-gradient-text">Au bon moment</span>
            </h1>

            <p
              className="px-fade-up max-w-xl text-lg text-white/70"
              style={{ animationDelay: "160ms" }}
            >
              Trouve le bon coach. Réserve simplement. Progresse vraiment.
            </p>

            <div
              className="px-fade-up flex flex-col items-start gap-4 sm:flex-row sm:items-center"
              style={{ animationDelay: "240ms" }}
            >
              <Link href="/coach" className="px-button text-base px-8 py-4 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,106,0,0.4)]">
                <BoltIcon className="h-5 w-5" />
                Trouver un coach
              </Link>
              <Link href="/auth/register" className="text-sm text-white/50 transition-colors hover:text-[color:var(--px-accent)]">
                Créer un compte →
              </Link>
            </div>

            <div className="px-fade-up" style={{ animationDelay: "320ms" }}>
              <PublicStats />
            </div>

            <div className="px-fade-up grid gap-3 sm:grid-cols-2 lg:hidden" style={{ animationDelay: "360ms" }}>
              <div className="relative h-32 overflow-hidden rounded-2xl border border-white/10">
                <Image
                  src="https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Ballon de football sur un terrain"
                  fill
                  sizes="(max-width: 640px) 100vw, 320px"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </div>
              <div className="relative h-32 overflow-hidden rounded-2xl border border-white/10">
                <Image
                  src="https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Coach de football donnant des consignes"
                  fill
                  sizes="(max-width: 640px) 100vw, 320px"
                  className="object-cover"
                  priority
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
                <Image
                  src="https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Ballon de football sur un terrain"
                  fill
                  sizes="(max-width: 1024px) 100vw, 360px"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <p className="absolute bottom-3 left-3 text-xs uppercase tracking-[0.2em] text-white/80">
                  Entraînement individuel
                </p>
              </div>
              <div className="relative h-40 overflow-hidden rounded-2xl border border-white/10">
                <Image
                  src="https://images.pexels.com/photos/114296/pexels-photo-114296.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Coach de football donnant des consignes"
                  fill
                  sizes="(max-width: 1024px) 100vw, 360px"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <p className="absolute bottom-3 left-3 text-xs uppercase tracking-[0.2em] text-white/80">
                  Coach certifié
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
              <p className="text-xs text-white/70 leading-relaxed">
                Coaching individuel, suivi personnalise et reservation en quelques clics.
                PerformX connecte joueurs, coachs et parents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <ScrollReveal>
        <section className="py-16">
          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.35em] text-white/70">
              <span className="h-[2px] w-10 rounded-full bg-[color:var(--px-accent)]" />
              Comment ça marche
              <span className="h-[2px] w-10 rounded-full bg-[color:var(--px-accent)]" />
            </div>
            <h2 className="text-4xl text-white sm:text-5xl">
              3 étapes, zéro friction.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/70">
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
                  <p className="text-sm leading-relaxed text-white/70">{step.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* ── Galerie terrain ── */}
      <ScrollReveal>
        <section className="py-12">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.35em] text-white/70">
              <span className="h-[2px] w-10 rounded-full bg-[color:var(--px-accent)]" />
              Expérience terrain
              <span className="h-[2px] w-10 rounded-full bg-[color:var(--px-accent)]" />
            </div>
            <h2 className="text-4xl text-white sm:text-5xl">Le foot au cœur de la plateforme</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {IMMERSIVE_GALLERY.map((item, index) => (
              <ScrollReveal key={item.src} delay={index * 100}>
                <div className="group relative h-56 overflow-hidden rounded-2xl border border-white/10">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <p className="absolute bottom-3 left-3 text-xs uppercase tracking-[0.2em] text-white/90">
                    {item.label}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* ── Pour les parents ── */}
      <ScrollReveal>
        <section className="py-12">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/8 to-transparent p-8 sm:p-10">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/70">
                  <span className="h-[2px] w-10 rounded-full bg-[color:var(--px-accent)]" />
                  Pour les parents
                </div>
                <h2 className="text-3xl text-white sm:text-4xl">
                  Une expérience rassurante et lisible
                </h2>
                <p className="mt-3 max-w-2xl text-sm text-white/70">
                  Suivez la progression de votre enfant, consultez les retours coach et reservez en toute simplicite.
                </p>
              </div>
              <Link href="/dashboard/parent" className="px-button-ghost">
                Voir l&apos;espace parent
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {PARENT_BENEFITS.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-lg text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-white/70">{item.text}</p>
                </div>
              ))}
            </div>
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
              <div className="mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/70">
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

      {/* ── Devenir coach ── */}
      <ScrollReveal>
        <section className="py-16">
          <div className="rounded-3xl border border-[color:var(--px-accent)]/10 bg-gradient-to-br from-[color:var(--px-accent)]/5 via-transparent to-transparent p-8 sm:p-12">
            <div className="mb-10 text-center">
              <h2 className="text-4xl text-white sm:text-5xl">
                Tu es coach diplômé<span className="text-[color:var(--px-accent)]"> ?</span>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-white/70">
                Rejoins les coachs qui developpent leur activite sur PerformX.
              </p>
            </div>

            <div className="mx-auto mb-10 grid max-w-3xl gap-6 sm:grid-cols-3">
              {[
                { icon: <CalendarIcon className="h-6 w-6" />, text: "Gère tes créneaux facilement" },
                { icon: <UsersIcon className="h-6 w-6" />, text: "Trouve des joueurs motivés" },
                { icon: <ShieldIcon className="h-6 w-6" />, text: "Reçois tes paiements simplement" },
              ].map((item) => (
                <div key={item.text} className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                    {item.icon}
                  </div>
                  <p className="text-sm font-medium text-white/80">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link href="/auth/register" className="px-button text-base px-8 py-4 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,106,0,0.4)]">
                Créer mon profil coach
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── Témoignages ── */}
      <ScrollReveal>
        <section className="py-16">
          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.35em] text-white/70">
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
                <div className="px-card relative flex flex-col gap-5 p-6">
                  <span className="pointer-events-none absolute right-4 top-2 select-none text-7xl font-bold leading-none text-[color:var(--px-accent)]/[0.06]">
                    &ldquo;
                  </span>

                  <p className="relative text-sm leading-relaxed text-white/70">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>

                  {testimonial.rating > 0 && (
                    <div className="flex gap-0.5">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <StarIcon key={i} className="h-4 w-4 fill-[color:var(--px-accent)] text-[color:var(--px-accent)]" />
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full border border-white/20 bg-[color:var(--px-surface)]"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                      <p className="text-xs text-white/50">{testimonial.role}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white/60">
                      {testimonial.badge}
                    </span>
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
                L&apos;excellence du coaching,{" "}
                <span className="px-gradient-text">enfin accessible</span>.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-white/70">
                Rejoins la communauté PerformX : joueurs, coachs diplômés et parents
                réunis sur une seule plateforme.
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
