"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { SEINE_MARITIME_CITIES } from "@/lib/constants";
import { getCoachDirectoryPaginated } from "@/lib/data/coaches";
import type { CoachRecord } from "@/lib/data/types";

const SPECIALITY_CHIPS = [
  "Tous",
  "Technique",
  "Preparation physique",
  "Gardienne",
  "Vision de jeu",
  "Frappe",
  "Dribbles",
  "Endurance",
  "Jeu defensif",
] as const;

export default function CoachPage() {
  const [coaches, setCoaches] = useState<CoachRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeChip, setActiveChip] = useState<(typeof SPECIALITY_CHIPS)[number]>("Tous");
  const [activeCity, setActiveCity] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "price-asc" | "price-desc" | "name">("rating");
  const [isDemo, setIsDemo] = useState(false);

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    try {
      const result = await getCoachDirectoryPaginated(pageNum);
      setCoaches((prev) => append ? [...prev, ...result.data.items] : result.data.items);
      setHasMore(result.data.hasMore);
      setTotal(result.data.total);
      setIsDemo(result.mode === "demo");
      setPage(pageNum);
    } catch {
      setError("Impossible de charger les coachs.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(0, false);
  }, [fetchPage]);

  const filteredCoaches = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const filtered = coaches.filter((coach) => {
      const location = `${coach.location ?? ""} ${coach.department ?? ""}`.toLowerCase();
      const matchesQuery =
        !normalized ||
        coach.name.toLowerCase().includes(normalized) ||
        coach.speciality.toLowerCase().includes(normalized) ||
        location.includes(normalized);
      const matchesChip =
        activeChip === "Tous" || coach.speciality.toLowerCase().includes(activeChip.toLowerCase());
      const matchesCity =
        !activeCity || (coach.location ?? "").toLowerCase() === activeCity.toLowerCase();

      return matchesQuery && matchesChip && matchesCity;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case "rating":
        sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "price-asc":
        sorted.sort((a, b) => (a.pricePerSession ?? 0) - (b.pricePerSession ?? 0));
        break;
      case "price-desc":
        sorted.sort((a, b) => (b.pricePerSession ?? 0) - (a.pricePerSession ?? 0));
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name, "fr"));
        break;
    }

    return sorted;
  }, [activeChip, activeCity, coaches, query, sortBy]);

  const avgRating = useMemo(() => {
    const ratings = coaches.map((coach) => coach.rating ?? 0).filter((rating) => rating > 0);
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }, [coaches]);

  const coachAvatarMap = useMemo(() => buildCoachAvatarMap(filteredCoaches), [filteredCoaches]);

  const totalReviews = useMemo(
    () => coaches.reduce((sum, coach) => sum + coach.reviewsCount, 0),
    [coaches],
  );

  return (
    <AppShell active="/coach" hideTitle>
      <section className="relative py-8 lg:py-12">
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="px-stack-3">
            <div className="flex items-center gap-3 px-fade-up">
              <span className="px-badge px-pulse">Annuaire</span>
              <span className="px-pill">{isDemo ? "Mode demo" : `+${coaches.length} coachs actifs`}</span>
            </div>

            <h1
              className="px-fade-up text-4xl leading-[1.1] text-white sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              Trouve le coach <span className="px-gradient-text">parfait.</span>
            </h1>

            <p
              className="px-fade-up max-w-lg text-base text-white/70"
              style={{ animationDelay: "160ms" }}
            >
              Parcours notre reseau de coachs certifies, filtre par specialite et reserve une
              seance en quelques clics.
            </p>

            <div
              className="px-fade-up flex items-center gap-4"
              style={{ animationDelay: "240ms" }}
            >
              <Link href="/auth/register/coach" className="px-button px-6 py-3 text-sm">
                <BoltIcon className="h-4 w-4" />
                Devenir coach
              </Link>
              <Link href="#coaches" className="px-button-ghost px-6 py-3 text-sm">
                Explorer
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div
            className="px-fade-up hidden flex-col gap-4 lg:flex"
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
              <p className="text-xs leading-relaxed text-white/70">
                <span className="font-semibold text-white/70">{totalReviews} avis</span> laisses
                par la communaute. Chaque coach est evalue apres chaque seance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ScrollReveal>
        <section id="coaches" className="px-stack-3">
          <div className="px-card px-stack-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Filtres rapides</p>
                <p className="text-xs text-white/70">
                  Affine ta recherche pour trouver le coach ideal.
                </p>
              </div>
              <div className="relative w-full sm:w-[320px]">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                <input
                  className="px-input pl-9"
                  placeholder="Rechercher un coach..."
                  aria-label="Rechercher un coach par nom, specialite ou localisation"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </div>

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

            <div className="flex flex-wrap items-center gap-3">
              <MapPinIcon className="h-4 w-4 text-white/70" />
              <select
                className="px-select max-w-[280px]"
                value={activeCity}
                onChange={(event) => setActiveCity(event.target.value)}
                aria-label="Filtrer par ville"
              >
                <option value="">Toutes les villes</option>
                {SEINE_MARITIME_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <select
                className="px-select max-w-[220px]"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
                aria-label="Trier les coachs"
              >
                <option value="rating">Meilleure note</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix decroissant</option>
                <option value="name">Nom A-Z</option>
              </select>
            </div>
          </div>

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

      {loading && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )}

      {error && (
        <FeedbackState
          tone="error"
          icon={<AlertIcon className="h-7 w-7 text-[color:var(--px-danger)]" />}
          title="Impossible de charger les coachs"
          description={error}
          actionLabel="Reessayer"
          onAction={() => window.location.reload()}
        />
      )}

      {!loading && filteredCoaches.length === 0 && !error && (
        <FeedbackState
          icon={<SearchIcon className="h-7 w-7 text-white/70" />}
          title="Aucun coach trouve"
          description="Aucun coach ne correspond a tes filtres actuels."
          actionLabel="Reinitialiser les filtres"
          onAction={() => {
            setQuery("");
            setActiveChip("Tous");
            setActiveCity("");
          }}
        />
      )}

      {!loading && filteredCoaches.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {filteredCoaches.map((coach, index) => (
              <ScrollReveal key={coach.id} delay={index * 60}>
                <CoachCard
                  reserveHref={`/booking?coach=${coach.id}`}
                  profileHref={`/coach/${coach.id}`}
                  avatarUrl={coachAvatarMap.get(coach.id) ?? coach.avatarUrl}
                  name={coach.name}
                  speciality={coach.speciality}
                  description={coach.bio ?? ""}
                  location={coach.location ?? coach.department ?? ""}
                  price={`${coach.pricePerSession ?? 0} EUR`}
                  rating={coach.rating ?? 0}
                  reviews={coach.reviewsCount}
                  availability={coach.availability}
                  experienceYears={coach.experienceYears}
                  focusAreas={coach.focusAreas}
                  sessionFormats={coach.sessionFormats}
                  pedagogy={coach.pedagogy}
                  certifications={coach.certifications}
                />
              </ScrollReveal>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-6">
              <button
                type="button"
                className="px-button-ghost px-8 py-3 text-sm"
                disabled={loadingMore}
                onClick={() => fetchPage(page + 1, true)}
              >
                {loadingMore ? <><span className="px-spinner mr-2" /> Chargement...</> : `Voir plus de coachs (${total - coaches.length} restants)`}
              </button>
            </div>
          )}
        </>
      )}

      <ScrollReveal>
        <section className="py-12">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 p-8 text-center sm:p-12">
            <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--px-accent)]/15 via-transparent to-[color:var(--px-accent-2)]/8" />
            <div className="relative">
              <h2 className="text-3xl text-white sm:text-4xl">
                Tu es coach ? <span className="px-gradient-text">Rejoins-nous.</span>
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-white/70">
                Cree ton profil, definis tes disponibilites et commence a recevoir des reservations
                des aujourd&apos;hui.
              </p>
              <Link
                href="/auth/register/coach"
                className="px-button mt-6 inline-flex px-6 py-3 text-sm"
              >
                <BoltIcon className="h-4 w-4" />
                Creer mon profil coach
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </AppShell>
  );
}
