"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  UserIcon,
} from "@/components/icons";
import { buildCoachAvatarMap } from "@/lib/coach-avatars";
import { SEINE_MARITIME_CITIES } from "@/lib/constants";
import { getCoachDirectoryPaginated } from "@/lib/data/coaches";
import type { CoachRecord } from "@/lib/data/types";
import { AGE_CATEGORIES } from "@/lib/football";

const SPECIALITY_CHIPS = [
  { key: "Tous", label: "Tous", emoji: null },
  { key: "Préparateur physique", label: "Prépa physique", emoji: "💪" },
  { key: "Spé gardien", label: "Gardien", emoji: "🧤" },
  { key: "Spé défenseur", label: "Défenseur", emoji: "🛡️" },
  { key: "Spé milieu", label: "Milieu", emoji: "🎯" },
  { key: "Spé attaquant", label: "Attaquant", emoji: "⚡" },
  { key: "Analyste vidéo", label: "Vidéo", emoji: "🎥" },
  { key: "Coach tactique au poste", label: "Tactique", emoji: "🧩" },
  { key: "Coach technique au poste", label: "Technique", emoji: "⚽" },
  { key: "Coach mental", label: "Mental", emoji: "🧠" },
  { key: "Coach Développement des jeunes", label: "Jeunes", emoji: "🌱" },
] as const;

type SpecialityChipKey = (typeof SPECIALITY_CHIPS)[number]["key"];

const LOCATION_FILTERS = [
  { value: "", label: "Tous lieux" },
  { value: "Domicile joueur", label: "À domicile" },
  { value: "Terrain extérieur", label: "Terrain" },
  { value: "Salle / gymnase", label: "Salle" },
  { value: "Club partenaire", label: "Club partenaire" },
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
  const [activeChip, setActiveChip] = useState<SpecialityChipKey>("Tous");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeCity, setActiveCity] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "price-asc" | "price-desc" | "name">("rating");
  const [isDemo, setIsDemo] = useState(false);
  const [priceMin, setPriceMin] = useState<number | "">("");
  const [priceMax, setPriceMax] = useState<number | "">("");
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyThisWeek, setOnlyThisWeek] = useState<boolean>(false);
  const [activeAgeCategory, setActiveAgeCategory] = useState<string>("");
  const [activeLocation, setActiveLocation] = useState<string>("");

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
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + 7);

    const filtered = coaches.filter((coach) => {
      const location = `${coach.location ?? ""} ${coach.department ?? ""}`.toLowerCase();
      const specialityHaystack = [coach.speciality, ...(coach.specialities ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery =
        !normalized ||
        coach.name.toLowerCase().includes(normalized) ||
        specialityHaystack.includes(normalized) ||
        location.includes(normalized);
      const matchesChip =
        activeChip === "Tous" || specialityHaystack.includes(activeChip.toLowerCase());
      const matchesCity =
        !activeCity || (coach.location ?? "").toLowerCase() === activeCity.toLowerCase();
      const price = coach.pricePerSession ?? 0;
      const matchesPriceMin = priceMin === "" || price >= priceMin;
      const matchesPriceMax = priceMax === "" || price <= priceMax;
      const matchesRating = minRating === 0 || (coach.rating ?? 0) >= minRating;
      const matchesThisWeek =
        !onlyThisWeek ||
        (coach.availability ?? []).some((slot) => {
          const slotDate = new Date(`${slot.date}T${slot.time}:00`);
          return slotDate >= now && slotDate <= endOfWeek;
        });
      const matchesAgeCategory =
        !activeAgeCategory ||
        (coach.acceptedAgeCategories ?? []).includes(activeAgeCategory);
      const matchesLocation =
        !activeLocation ||
        (coach.interventionLocations ?? []).includes(activeLocation);

      return (
        matchesQuery &&
        matchesChip &&
        matchesCity &&
        matchesPriceMin &&
        matchesPriceMax &&
        matchesRating &&
        matchesThisWeek &&
        matchesAgeCategory &&
        matchesLocation
      );
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
  }, [
    activeChip,
    activeCity,
    coaches,
    query,
    sortBy,
    priceMin,
    priceMax,
    minRating,
    onlyThisWeek,
    activeAgeCategory,
    activeLocation,
  ]);

  const chipCounts = useMemo(() => {
    const result: Record<string, number> = { Tous: coaches.length };
    for (const chip of SPECIALITY_CHIPS) {
      if (chip.key === "Tous") continue;
      result[chip.key] = coaches.filter((coach) => {
        const hay = [coach.speciality, ...(coach.specialities ?? [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(chip.key.toLowerCase());
      }).length;
    }
    return result;
  }, [coaches]);

  const advancedFilterCount = useMemo(() => {
    let count = 0;
    if (priceMin !== "") count += 1;
    if (priceMax !== "") count += 1;
    if (minRating > 0) count += 1;
    if (onlyThisWeek) count += 1;
    if (activeAgeCategory) count += 1;
    if (activeLocation) count += 1;
    return count;
  }, [priceMin, priceMax, minRating, onlyThisWeek, activeAgeCategory, activeLocation]);

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
              <span className="px-pill">
                {isDemo
                  ? "Mode démo"
                  : coaches.length > 0
                    ? `+${coaches.length} coach${coaches.length > 1 ? "s" : ""} actif${coaches.length > 1 ? "s" : ""}`
                    : "Lancement en cours"}
              </span>
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
              Parcours notre réseau de coachs certifiés, filtre par spécialité et réserve une
              séance en quelques clics.
            </p>

            <div
              className="px-fade-up flex items-center gap-4"
              style={{ animationDelay: "240ms" }}
            >
              <Link href="#coaches" className="px-button px-6 py-3 text-sm">
                <BoltIcon className="h-4 w-4" />
                Explorer les coachs
              </Link>
              <Link href="/auth/register/coach" className="px-button-ghost px-6 py-3 text-sm">
                Devenir coach
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div
            className="px-fade-up relative hidden aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_120px_-40px_rgba(255,106,0,0.45)] lg:block"
            style={{ animationDelay: "200ms" }}
          >
            {/* Photo terrain / action */}
            <Image
              src="https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Joueur de football en action sur le terrain"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              priority
              className="object-cover"
            />
            {/* Overlays : accent orange + vignette sombre pour la lisibilité */}
            <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--px-bg)] via-[color:var(--px-bg)]/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--px-bg)] via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,106,0,0.35),transparent_55%)]" />

            {/* Badge "En ligne" flottant */}
            <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--px-success)] opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--px-success)]" />
              </span>
              Coachs en ligne
            </div>

            {/* Stats / CTA en bas selon qu'il y ait des coachs ou non */}
            <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/15 bg-black/55 p-4 backdrop-blur-xl">
              {coaches.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Coachs</p>
                    <p className="mt-1 text-2xl font-semibold text-white">{coaches.length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Note</p>
                    <div className="mt-1 flex items-baseline gap-1">
                      <p className="text-2xl font-semibold text-white">{avgRating.toFixed(1)}</p>
                      <StarIcon className="h-3.5 w-3.5 text-[color:var(--px-accent)]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Avis</p>
                    <p className="mt-1 text-2xl font-semibold text-white">{totalReviews}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                    Lancement officiel
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    Premiers coachs cette semaine.
                  </p>
                  <p className="mt-1 text-xs text-white/70">
                    Inscris-toi maintenant pour réserver en priorité.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {!loading && coaches.length > 0 && (
      <ScrollReveal>
        <section id="coaches" className="px-stack-3">
          <div className="px-card px-stack-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Filtres rapides</p>
                <p className="text-xs text-white/70">
                  Affine ta recherche pour trouver le coach idéal.
                </p>
              </div>
              <div className="relative w-full sm:w-[320px]">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                <input
                  className="px-input pl-9"
                  placeholder="Rechercher un coach..."
                  aria-label="Rechercher un coach par nom, spécialité ou localisation"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {SPECIALITY_CHIPS.map((chip) => {
                const count = chipCounts[chip.key] ?? 0;
                const isActive = activeChip === chip.key;
                const hasCoaches = coaches.length > 0;
                const disabled = chip.key !== "Tous" && hasCoaches && count === 0;
                const showCount = hasCoaches && count > 0;
                return (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setActiveChip(chip.key)}
                    data-active={isActive}
                    disabled={disabled}
                    className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      isActive
                        ? "border-[color:var(--px-accent)] bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)] shadow-[0_0_0_3px_rgba(255,106,0,0.08)]"
                        : disabled
                          ? "border-white/5 bg-white/[0.02] text-white/30 cursor-not-allowed"
                          : "border-white/10 bg-white/5 text-white/75 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {chip.emoji && (
                      <span className="text-sm leading-none" aria-hidden="true">
                        {chip.emoji}
                      </span>
                    )}
                    <span>{chip.label}</span>
                    {showCount && (
                      <span
                        className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          isActive
                            ? "bg-[color:var(--px-accent)]/20 text-[color:var(--px-accent)]"
                            : "bg-white/5 text-white/50"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
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
                <option value="price-desc">Prix décroissant</option>
                <option value="name">Nom A-Z</option>
              </select>
            </div>

            {/* Toggle filtres avancés */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/75 transition hover:border-white/30 hover:text-white"
              >
                <FilterIcon className="h-3.5 w-3.5" />
                {showAdvancedFilters ? "Masquer les filtres" : "Plus de filtres"}
                {advancedFilterCount > 0 && (
                  <span className="rounded-full bg-[color:var(--px-accent)]/20 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--px-accent)]">
                    {advancedFilterCount}
                  </span>
                )}
              </button>
              {advancedFilterCount > 0 && !showAdvancedFilters && (
                <p className="text-[11px] text-white/50">
                  {advancedFilterCount} filtre{advancedFilterCount > 1 ? "s" : ""} actif
                  {advancedFilterCount > 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Filtres avancés : prix, note, dispo */}
            <div className={`flex-wrap items-center gap-4 ${showAdvancedFilters ? "flex" : "hidden"}`}>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.2em] text-white/50">Budget</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Min €"
                  className="px-input w-20 text-xs"
                  value={priceMin}
                  onChange={(e) =>
                    setPriceMin(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  min={0}
                  aria-label="Prix minimum"
                />
                <span className="text-white/40">–</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Max €"
                  className="px-input w-20 text-xs"
                  value={priceMax}
                  onChange={(e) =>
                    setPriceMax(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  min={0}
                  aria-label="Prix maximum"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.2em] text-white/50">Note</span>
                {[0, 3.5, 4, 4.5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMinRating(value)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      minRating === value
                        ? "border-[color:var(--px-accent)] bg-[color:var(--px-accent)]/15 text-[color:var(--px-accent)]"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                    }`}
                  >
                    {value === 0 ? "Toutes" : `${value}+`}
                  </button>
                ))}
              </div>

              <label className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-white/20">
                <input
                  type="checkbox"
                  checked={onlyThisWeek}
                  onChange={(e) => setOnlyThisWeek(e.target.checked)}
                  className="h-3.5 w-3.5"
                />
                Dispo cette semaine
              </label>

              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.2em] text-white/50">Âge</span>
                <select
                  className="px-select max-w-[150px] text-xs"
                  value={activeAgeCategory}
                  onChange={(event) => setActiveAgeCategory(event.target.value)}
                  aria-label="Filtrer par tranche d'âge"
                >
                  <option value="">Toutes</option>
                  {AGE_CATEGORIES.map((age) => (
                    <option key={age} value={age}>
                      {age}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.2em] text-white/50">Lieu</span>
                <select
                  className="px-select max-w-[200px] text-xs"
                  value={activeLocation}
                  onChange={(event) => setActiveLocation(event.target.value)}
                  aria-label="Filtrer par lieu d'intervention"
                >
                  {LOCATION_FILTERS.map((loc) => (
                    <option key={loc.value} value={loc.value}>
                      {loc.label}
                    </option>
                  ))}
                </select>
              </div>

              {(priceMin !== "" ||
                priceMax !== "" ||
                minRating !== 0 ||
                onlyThisWeek ||
                activeCity ||
                activeChip !== "Tous" ||
                activeAgeCategory ||
                activeLocation ||
                query) && (
                <button
                  type="button"
                  onClick={() => {
                    setPriceMin("");
                    setPriceMax("");
                    setMinRating(0);
                    setOnlyThisWeek(false);
                    setActiveCity("");
                    setActiveChip("Tous");
                    setActiveAgeCategory("");
                    setActiveLocation("");
                    setQuery("");
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 transition hover:border-white/20 hover:text-white"
                >
                  Réinitialiser
                </button>
              )}
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
      )}

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
          actionLabel="Réessayer"
          onAction={() => window.location.reload()}
        />
      )}

      {!loading && coaches.length === 0 && !error && (
        <ScrollReveal>
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[color:var(--px-accent)]/15 via-transparent to-[color:var(--px-accent-2)]/10 p-8 sm:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,106,0,0.25),transparent_55%)]" />
            <div className="absolute -left-10 -top-10 hidden h-48 w-48 rounded-full bg-[color:var(--px-accent)]/10 blur-3xl lg:block" />

            <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="space-y-5">
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--px-accent)]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--px-accent)] opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--px-accent)]" />
                  </span>
                  Lancement en cours
                </span>

                <h2 className="text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
                  Les premiers coachs{" "}
                  <span className="px-gradient-text">arrivent cette semaine.</span>
                </h2>

                <p className="max-w-lg text-base text-white/75">
                  PerformX connecte joueurs et coachs certifiés pour des séances 1-to-1. Les
                  coachs vérifiés apparaîtront ici dès la mise en ligne. Inscris-toi dès
                  aujourd&apos;hui pour ne rien rater.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/auth/register/coach" className="px-button px-6 py-3 text-sm">
                    <BoltIcon className="h-4 w-4" />
                    Devenir coach
                  </Link>
                  <Link
                    href="/auth/register/player"
                    className="px-button-ghost px-6 py-3 text-sm"
                  >
                    <UserIcon className="h-4 w-4" />
                    Créer mon compte joueur
                  </Link>
                </div>

                <div className="grid gap-3 pt-4 sm:grid-cols-3">
                  {[
                    { emoji: "🎯", label: "Matching coach/joueur sur tranche d'âge, poste et zone" },
                    { emoji: "💬", label: "Messagerie directe pour caler les séances en 2 clics" },
                    { emoji: "📈", label: "Suivi de progression sur 5 axes après chaque séance" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/75"
                    >
                      <span className="mb-1 block text-xl">{item.emoji}</span>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-white/15 shadow-[0_40px_120px_-40px_rgba(255,106,0,0.45)]">
                  <Image
                    src="https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=900"
                    alt="Entraînement de football"
                    fill
                    sizes="(min-width: 1024px) 35vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--px-bg)]/80 via-transparent to-transparent" />
                  <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/15 bg-black/55 p-3 backdrop-blur-xl">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                      Prochaine mise en ligne
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Coachs certifiés · Seine-Maritime
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {!loading && filteredCoaches.length === 0 && !error && coaches.length > 0 && (
        <FeedbackState
          icon={<SearchIcon className="h-7 w-7 text-white/70" />}
          title="Aucun coach trouvé"
          description="Aucun coach ne correspond à tes filtres actuels."
          actionLabel="Réinitialiser les filtres"
          onAction={() => {
            setQuery("");
            setActiveChip("Tous");
            setActiveCity("");
            setActiveAgeCategory("");
            setActiveLocation("");
            setPriceMin("");
            setPriceMax("");
            setMinRating(0);
            setOnlyThisWeek(false);
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
                  messageHref={`/messages?coach=${coach.id}`}
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

      {coaches.length > 0 && (
        <ScrollReveal>
          <section className="py-12">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 p-8 text-center sm:p-12">
              <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--px-accent)]/15 via-transparent to-[color:var(--px-accent-2)]/8" />
              <div className="relative">
                <h2 className="text-3xl text-white sm:text-4xl">
                  Tu es coach ? <span className="px-gradient-text">Rejoins-nous.</span>
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-white/70">
                  Créé ton profil, définis tes disponibilités et commence à recevoir des
                  réservations dès aujourd&apos;hui.
                </p>
                <Link
                  href="/auth/register/coach"
                  className="px-button mt-6 inline-flex px-6 py-3 text-sm"
                >
                  <BoltIcon className="h-4 w-4" />
                  Créer mon profil coach
                </Link>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}
    </AppShell>
  );
}
