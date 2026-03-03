"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import CoachCard from "@/components/coach-card";
import { FeedbackState } from "@/components/feedback-state";
import { SkeletonCard } from "@/components/skeleton";
import ScrollReveal from "@/components/scroll-reveal";
import {
  SearchIcon,
  FilterIcon,
  WhistleIcon,
  StarIcon,
  BoltIcon,
  ArrowRightIcon,
  AlertIcon,
  MapPinIcon,
} from "@/components/icons";
import { buildCoachAvatarMap } from "@/lib/coach-avatars";
import { supabase } from "@/lib/supabase";
import { mockCoaches } from "@/lib/mock-data";
import { SEINE_MARITIME_CITIES } from "@/lib/constants";

type CoachRow = {
  id: string;
  name: string;
  speciality: string;
  bio: string | null;
  location: string | null;
  price_per_session: number | null;
  rating: number | null;
  reviews_count: number | null;
  avatar_url: string | null;
};

const SPECIALITY_CHIPS = [
  "Tous",
  "Technique",
  "Préparation physique",
  "Gardienne",
  "Vision de jeu",
  "Frappe",
  "Dribbles",
  "Endurance",
  "Jeu défensif",
];

function mapMockToRow(coach: (typeof mockCoaches)[number]): CoachRow {
  return {
    id: coach.id,
    name: coach.name,
    speciality: coach.speciality,
    bio: coach.bio,
    location: coach.location,
    price_per_session: coach.pricePerSession,
    rating: coach.rating,
    reviews_count: coach.reviews,
    avatar_url: null,
  };
}

export default function CoachPage() {
  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeChip, setActiveChip] = useState("Tous");
  const [activeCity, setActiveCity] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "price-asc" | "price-desc" | "name">("rating");

  useEffect(() => {
    let mounted = true;
    const fetchCoaches = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("public_coaches")
        .select("id, name, speciality, bio, location, price_per_session, rating, reviews_count, avatar_url")
        .order("rating", { ascending: false });

      if (!mounted) return;
      if (error || !data || data.length === 0) {
        setError(null);
        setCoaches(mockCoaches.map(mapMockToRow));
      } else {
        setError(null);
        setCoaches(data);
      }
      setLoading(false);
    };

    fetchCoaches();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredCoaches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = coaches.filter((coach) => {
      const matchesQuery =
        !normalized ||
        coach.name.toLowerCase().includes(normalized) ||
        coach.speciality.toLowerCase().includes(normalized) ||
        (coach.location ?? "").toLowerCase().includes(normalized);
      const matchesChip =
        activeChip === "Tous" ||
        coach.speciality.toLowerCase().includes(activeChip.toLowerCase());
      const matchesCity =
        !activeCity ||
        (coach.location ?? "").toLowerCase() === activeCity.toLowerCase();
      return matchesQuery && matchesChip && matchesCity;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case "rating":
        sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "price-asc":
        sorted.sort((a, b) => (a.price_per_session ?? 0) - (b.price_per_session ?? 0));
        break;
      case "price-desc":
        sorted.sort((a, b) => (b.price_per_session ?? 0) - (a.price_per_session ?? 0));
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name, "fr"));
        break;
    }
    return sorted;
  }, [coaches, query, activeChip, activeCity, sortBy]);

  const avgRating = useMemo(() => {
    const ratings = coaches.map((c) => c.rating ?? 0).filter((r) => r > 0);
    if (ratings.length === 0) return 0;
    return ratings.reduce((a, b) => a + b, 0) / ratings.length;
  }, [coaches]);

  const coachAvatarMap = useMemo(() => buildCoachAvatarMap(filteredCoaches), [filteredCoaches]);

  const totalReviews = useMemo(
    () => coaches.reduce((sum, c) => sum + (c.reviews_count ?? 0), 0),
    [coaches],
  );

  return (
    <AppShell active="/coach" hideTitle>
      {/* ── Hero header ── */}
      <section className="relative py-8 lg:py-12">
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="px-stack-3">
            <div className="flex items-center gap-3 px-fade-up">
              <span className="px-badge px-pulse">Annuaire</span>
              <span className="px-pill">+{coaches.length} coachs actifs</span>
            </div>

            <h1
              className="px-fade-up text-4xl leading-[1.1] text-white sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              Trouve le coach{" "}
              <span className="px-gradient-text">parfait.</span>
            </h1>

            <p
              className="px-fade-up max-w-lg text-base text-white/70"
              style={{ animationDelay: "160ms" }}
            >
              Parcours notre réseau de coachs certifiés, filtre par spécialité
              et réserve une séance en quelques clics.
            </p>

            <div
              className="px-fade-up flex items-center gap-4"
              style={{ animationDelay: "240ms" }}
            >
              <Link href="/auth/register/coach" className="px-button text-sm px-6 py-3">
                <BoltIcon className="h-4 w-4" />
                Devenir coach
              </Link>
              <Link href="#coaches" className="px-button-ghost text-sm px-6 py-3">
                Explorer
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Stats sidebar */}
          <div
            className="px-fade-up hidden lg:flex flex-col gap-4"
            style={{ animationDelay: "200ms" }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="px-card p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                  <WhistleIcon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-semibold text-white">{coaches.length}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Coachs</p>
              </div>
              <div className="px-card p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]">
                  <StarIcon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-semibold text-white">{avgRating.toFixed(1)}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Note moyenne</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 to-transparent p-4">
              <p className="text-xs text-white/70 leading-relaxed">
                <span className="font-semibold text-white/70">{totalReviews} avis</span> laissés
                par la communauté. Chaque coach est évalué après chaque séance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Filtres ── */}
      <ScrollReveal>
        <section id="coaches" className="px-stack-3">
          <div className="px-card p-4 px-stack-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Filtres rapides</p>
                <p className="text-xs text-white/70">Affine ta recherche pour trouver le coach idéal.</p>
              </div>
              <div className="relative w-full sm:w-[320px]">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                <input
                  className="px-input pl-9"
                  placeholder="Rechercher un coach..."
                  aria-label="Rechercher un coach par nom, spécialité ou localisation"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Speciality chips */}
            <div className="flex flex-wrap gap-2">
              {SPECIALITY_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setActiveChip(chip)}
                  data-active={activeChip === chip}
                  className="px-chip"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* City filter + Sort */}
            <div className="flex flex-wrap items-center gap-3">
              <MapPinIcon className="h-4 w-4 text-white/70" />
              <select
                className="px-select max-w-[280px]"
                value={activeCity}
                onChange={(e) => setActiveCity(e.target.value)}
                aria-label="Filtrer par ville"
              >
                <option value="">Toutes les villes</option>
                {SEINE_MARITIME_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                className="px-select max-w-[220px]"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                aria-label="Trier les coachs"
              >
                <option value="rating">Meilleure note</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="name">Nom A-Z</option>
              </select>
            </div>
          </div>

          {/* Résultat count */}
          {!loading && filteredCoaches.length > 0 && (
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-white/70" />
              <p className="text-sm text-white/70">
                {filteredCoaches.length} coach{filteredCoaches.length > 1 ? "s" : ""} disponible
                {filteredCoaches.length > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </section>
      </ScrollReveal>

      {/* ── Loading ── */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <FeedbackState
          tone="error"
          icon={<AlertIcon className="h-7 w-7 text-[color:var(--px-danger)]" />}
          title="Impossible de charger les coachs"
          description={error}
          actionLabel="Réessayer"
          onAction={() => window.location.reload()}
        />
      )}

      {/* ── Empty ── */}
      {!loading && filteredCoaches.length === 0 && !error && (
        <FeedbackState
          icon={<SearchIcon className="h-7 w-7 text-white/70" />}
          title="Aucun coach trouvé"
          description="Aucun coach ne correspond à tes filtres actuels."
          actionLabel="Réinitialiser les filtres"
          onAction={() => {
            setQuery("");
            setActiveChip("Tous");
            setActiveCity("");
          }}
        />
      )}

      {/* ── Coach grid ── */}
      {!loading && filteredCoaches.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {filteredCoaches.map((coach, index) => (
            <ScrollReveal key={coach.id} delay={index * 60}>
              <CoachCard
                reserveHref={`/booking?coach=${coach.id}`}
                profileHref={`/coach/${coach.id}`}
                avatarUrl={coachAvatarMap.get(coach.id) ?? coach.avatar_url}
                name={coach.name}
                speciality={coach.speciality}
                description={coach.bio ?? ""}
                location={coach.location ?? ""}
                price={`${coach.price_per_session ?? 0}€`}
                rating={coach.rating ?? 0}
                reviews={coach.reviews_count ?? 0}
              />
            </ScrollReveal>
          ))}
        </div>
      )}

      {/* ── CTA bottom ── */}
      <ScrollReveal>
        <section className="py-12">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 p-8 text-center sm:p-12">
            <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--px-accent)]/15 via-transparent to-[color:var(--px-accent-2)]/8" />
            <div className="relative">
              <h2 className="text-3xl text-white sm:text-4xl">
                Tu es coach ?{" "}
                <span className="px-gradient-text">Rejoins-nous.</span>
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-white/70">
                Crée ton profil, définis tes disponibilités et commence à recevoir des réservations dès aujourd&apos;hui.
              </p>
              <Link href="/auth/register/coach" className="px-button mt-6 inline-flex text-sm px-6 py-3">
                <BoltIcon className="h-4 w-4" />
                Créer mon profil coach
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </AppShell>
  );
}
