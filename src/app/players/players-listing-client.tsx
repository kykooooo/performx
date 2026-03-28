"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import { FeedbackState } from "@/components/feedback-state";
import PlayerCard from "@/components/player-card";
import { SkeletonPlayerCard } from "@/components/skeleton";
import ScrollReveal from "@/components/scroll-reveal";
import {
  SearchIcon,
  FilterIcon,
  UsersIcon,
  StarIcon,
  BoltIcon,
  ArrowRightIcon,
  AlertIcon,
} from "@/components/icons";
import { SEINE_MARITIME_CITIES } from "@/lib/constants";
import { getPlayerDirectory } from "@/lib/data/players";
import type { PlayerRecord } from "@/lib/data/types";

const LEVEL_CHIPS = ["Tous", "Debutant", "Intermediaire", "Confirme", "Elite"] as const;

const normalizeLevelKey = (value: string | null | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeLevel, setActiveLevel] = useState<(typeof LEVEL_CHIPS)[number]>("Tous");
  const [positionFilter, setPositionFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchPlayers = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getPlayerDirectory();
        if (!mounted) return;
        setPlayers(result.data);
        setIsDemo(result.mode === "demo");
      } catch {
        if (!mounted) return;
        setError("Impossible de charger les joueurs.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPlayers();

    return () => {
      mounted = false;
    };
  }, []);

  const positions = useMemo(
    () => Array.from(new Set(players.map((player) => player.position).filter(Boolean))) as string[],
    [players],
  );

  const allCities = useMemo(() => {
    const playerCities = players.map((player) => player.city).filter(Boolean) as string[];
    return Array.from(new Set([...playerCities, ...SEINE_MARITIME_CITIES])).sort((a, b) =>
      a.localeCompare(b, "fr"),
    );
  }, [players]);

  const filteredPlayers = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return players.filter((player) => {
      const name = player.name.toLowerCase();
      const city = (player.city ?? "").toLowerCase();
      const position = (player.position ?? "").toLowerCase();
      const level = (player.level ?? "").toLowerCase();
      const matchesQuery =
        !normalized || [name, city, position, level].some((value) => value.includes(normalized));
      const matchesLevel =
        activeLevel === "Tous" || normalizeLevelKey(player.level) === normalizeLevelKey(activeLevel);
      const matchesPosition = positionFilter === "all" || player.position === positionFilter;
      const matchesCity =
        !cityFilter || (player.city ?? "").toLowerCase().includes(cityFilter.toLowerCase());

      return matchesQuery && matchesLevel && matchesPosition && matchesCity;
    });
  }, [activeLevel, cityFilter, players, positionFilter, query]);

  const avgRating = useMemo(() => {
    const ratings = players.map((player) => player.rating ?? 0).filter((rating) => rating > 0);
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }, [players]);

  return (
    <AppShell active="/players" hideTitle>
      <section className="relative py-8 lg:py-12">
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="px-stack-3">
            <div className="flex items-center gap-3 px-fade-up">
              <span className="px-badge px-pulse">Communaute</span>
              <span className="px-pill">
                {isDemo ? "Mode demo" : `+${players.length} joueurs inscrits`}
              </span>
            </div>

            <h1
              className="px-fade-up text-4xl leading-[1.1] text-white sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              Explore les <span className="px-gradient-text">talents.</span>
            </h1>

            <p
              className="px-fade-up max-w-lg text-base text-white/70"
              style={{ animationDelay: "160ms" }}
            >
              Decouvre les profils joueurs, leurs objectifs et leur progression. Trouve le
              partenaire d&apos;entrainement ideal.
            </p>

            <div
              className="px-fade-up flex items-center gap-4"
              style={{ animationDelay: "240ms" }}
            >
              <Link href="/auth/register/player" className="px-button px-6 py-3 text-sm">
                <BoltIcon className="h-4 w-4" />
                Creer mon profil
              </Link>
              <Link href="#players" className="px-button-ghost px-6 py-3 text-sm">
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
                  <UsersIcon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-semibold text-white">{players.length}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Joueurs</p>
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
                <span className="font-semibold text-white/70">{allCities.length} villes</span>{" "}
                representees. Des joueurs de tous niveaux prets a progresser ensemble.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ScrollReveal>
        <section id="players" className="px-stack-3">
          <div className="px-card px-stack-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Recherche joueurs</p>
                <p className="text-xs text-white/70">Filtre par niveau, poste ou localisation.</p>
              </div>
              <div className="relative w-full sm:w-[320px]">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                <input
                  className="px-input pl-9"
                  placeholder="Rechercher un joueur..."
                  aria-label="Rechercher un joueur par nom, ville ou poste"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {LEVEL_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setActiveLevel(chip)}
                  data-active={activeLevel === chip}
                  className="px-chip"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="px-outline p-3">
                <label
                  htmlFor="filter-position"
                  className="text-[11px] uppercase tracking-[0.2em] text-white/70"
                >
                  Poste
                </label>
                <select
                  id="filter-position"
                  className="px-select mt-2"
                  value={positionFilter}
                  onChange={(event) => setPositionFilter(event.target.value)}
                >
                  <option value="all">Tous les postes</option>
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>
              <div className="px-outline p-3">
                <label
                  htmlFor="filter-city"
                  className="text-[11px] uppercase tracking-[0.2em] text-white/70"
                >
                  Ville
                </label>
                <input
                  id="filter-city"
                  list="city-suggestions"
                  className="px-input mt-2"
                  placeholder="Tapez une ville..."
                  value={cityFilter}
                  onChange={(event) => setCityFilter(event.target.value)}
                />
                <datalist id="city-suggestions">
                  {allCities.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {!loading && filteredPlayers.length > 0 && (
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-white/70" />
              <p className="text-sm text-white/70">
                {filteredPlayers.length} joueur{filteredPlayers.length > 1 ? "s" : ""} trouve
                {filteredPlayers.length > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </section>
      </ScrollReveal>

      {loading && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonPlayerCard key={index} />
          ))}
        </div>
      )}

      {error && (
        <FeedbackState
          tone="error"
          icon={<AlertIcon className="h-7 w-7 text-[color:var(--px-danger)]" />}
          title="Impossible de charger les joueurs"
          description={error}
          actionLabel="Reessayer"
          onAction={() => window.location.reload()}
        />
      )}

      {!loading && filteredPlayers.length === 0 && !error && (
        <FeedbackState
          icon={<SearchIcon className="h-7 w-7 text-white/70" />}
          title="Aucun joueur trouve"
          description="Aucun joueur ne correspond a tes filtres actuels."
          actionLabel="Reinitialiser les filtres"
          onAction={() => {
            setQuery("");
            setActiveLevel("Tous");
            setPositionFilter("all");
            setCityFilter("");
          }}
        />
      )}

      {!loading && filteredPlayers.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {filteredPlayers.map((player, index) => (
            <ScrollReveal key={player.id} delay={index * 60}>
              <PlayerCard
                profileHref={`/players/${player.id}`}
                avatarUrl={player.avatarUrl}
                name={player.name}
                level={player.level ?? "Niveau a definir"}
                position={player.position ?? "Joueur"}
                city={player.city ?? "Localisation non definie"}
                objectives={player.objectives ?? undefined}
                rating={player.rating ?? 0}
                reviews={player.reviewsCount}
                ageCategory={player.ageCategory ?? null}
                dominantFoot={player.dominantFoot ?? null}
                currentClub={player.currentClub ?? null}
                positionFamily={player.positionFamily ?? null}
                positionObjectives={player.positionObjectives}
              />
            </ScrollReveal>
          ))}
        </div>
      )}
    </AppShell>
  );
}
