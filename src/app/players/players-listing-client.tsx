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
import { supabase } from "@/lib/supabase";
import { mockPlayers } from "@/lib/mock-data";
import { SEINE_MARITIME_CITIES } from "@/lib/constants";
import type { PositionFamily } from "@/lib/types";

type PlayerRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  level: string | null;
  position: string | null;
  position_family?: string | null;
  objectives: string | null;
  dominant_foot?: string | null;
  current_club?: string | null;
  age_category?: string | null;
  avatar_url: string | null;
  rating: number | null;
  reviews_count: number | null;
};

const LEVEL_CHIPS = ["Tous", "Débutant", "Intermédiaire", "Confirmé", "Élite"];

function mapMockToRow(player: (typeof mockPlayers)[number]): PlayerRow {
  const [firstName, ...rest] = player.name.split(" ");
  return {
    user_id: player.id,
    first_name: firstName,
    last_name: rest.join(" "),
    city: player.city,
    level: player.level,
    position: player.position,
    position_family: player.positionFamily ?? null,
    objectives: player.objectives ?? null,
    dominant_foot: player.dominantFoot ?? null,
    current_club: player.currentClub ?? null,
    age_category: player.ageCategory ?? null,
    avatar_url: null,
    rating: player.rating,
    reviews_count: player.reviews,
  };
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeLevel, setActiveLevel] = useState("Tous");
  const [positionFilter, setPositionFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchPlayers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("public_players")
        .select("user_id, first_name, last_name, city, level, position, position_family, objectives, dominant_foot, current_club, age_category, avatar_url, rating, reviews_count")
        .order("rating", { ascending: false });

      if (!mounted) return;
      if (error || !data || data.length === 0) {
        setError(null);
        setPlayers(mockPlayers.map(mapMockToRow));
      } else {
        setError(null);
        setPlayers(data);
      }
      setLoading(false);
    };

    fetchPlayers();
    return () => {
      mounted = false;
    };
  }, []);

  const positions = useMemo(
    () => Array.from(new Set(players.map((p) => p.position).filter(Boolean))) as string[],
    [players],
  );
  const allCities = useMemo(() => {
    const playerCities = players.map((p) => p.city).filter(Boolean) as string[];
    return Array.from(new Set([...playerCities, ...SEINE_MARITIME_CITIES])).sort((a, b) =>
      a.localeCompare(b, "fr"),
    );
  }, [players]);

  const filteredPlayers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return players.filter((player) => {
      const name = [player.first_name, player.last_name].filter(Boolean).join(" ").toLowerCase();
      const city = (player.city ?? "").toLowerCase();
      const position = (player.position ?? "").toLowerCase();
      const level = (player.level ?? "").toLowerCase();
      const matchesQuery =
        !normalized || [name, city, position, level].some((v) => v.includes(normalized));
      const matchesLevel =
        activeLevel === "Tous" || player.level === activeLevel;
      const matchesPosition =
        positionFilter === "all" || player.position === positionFilter;
      const matchesCity =
        !cityFilter || (player.city ?? "").toLowerCase().includes(cityFilter.toLowerCase());
      return matchesQuery && matchesLevel && matchesPosition && matchesCity;
    });
  }, [players, query, activeLevel, positionFilter, cityFilter]);

  const avgRating = useMemo(() => {
    const ratings = players.map((p) => p.rating ?? 0).filter((r) => r > 0);
    if (ratings.length === 0) return 0;
    return ratings.reduce((a, b) => a + b, 0) / ratings.length;
  }, [players]);

  return (
    <AppShell active="/players" hideTitle>
      {/* ── Hero header ── */}
      <section className="relative py-8 lg:py-12">
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="px-stack-3">
            <div className="flex items-center gap-3 px-fade-up">
              <span className="px-badge px-pulse">Communauté</span>
              <span className="px-pill">+640 joueurs inscrits</span>
            </div>

            <h1
              className="px-fade-up text-4xl leading-[1.1] text-white sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              Explore les{" "}
              <span className="px-gradient-text">talents.</span>
            </h1>

            <p
              className="px-fade-up max-w-lg text-base text-white/70"
              style={{ animationDelay: "160ms" }}
            >
              Découvre les profils joueurs, leurs objectifs et leur progression.
              Trouve le partenaire d&apos;entraînement idéal.
            </p>

            <div
              className="px-fade-up flex items-center gap-4"
              style={{ animationDelay: "240ms" }}
            >
              <Link href="/auth/register/player" className="px-button text-sm px-6 py-3">
                <BoltIcon className="h-4 w-4" />
                Créer mon profil
              </Link>
              <Link href="#players" className="px-button-ghost text-sm px-6 py-3">
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
              <p className="text-xs text-white/70 leading-relaxed">
                <span className="font-semibold text-white/70">{allCities.length} villes</span>{" "}
                représentées. Des joueurs de tous niveaux prêts à progresser ensemble.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Filtres ── */}
      <ScrollReveal>
        <section id="players" className="px-stack-3">
          <div className="px-card p-4 px-stack-2">
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
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Level chips */}
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

            {/* Select filters */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="px-outline p-3">
                <label htmlFor="filter-position" className="text-[11px] uppercase tracking-[0.2em] text-white/70">Poste</label>
                <select
                  id="filter-position"
                  className="px-select mt-2"
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
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
                <label htmlFor="filter-city" className="text-[11px] uppercase tracking-[0.2em] text-white/70">Ville</label>
                <input
                  id="filter-city"
                  list="city-suggestions"
                  className="px-input mt-2"
                  placeholder="Tapez une ville..."
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                />
                <datalist id="city-suggestions">
                  {allCities.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Résultat count */}
          {!loading && filteredPlayers.length > 0 && (
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-white/70" />
              <p className="text-sm text-white/70">
                {filteredPlayers.length} joueur{filteredPlayers.length > 1 ? "s" : ""} trouvé
                {filteredPlayers.length > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </section>
      </ScrollReveal>

      {/* ── Loading ── */}
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonPlayerCard key={index} />
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <FeedbackState
          tone="error"
          icon={<AlertIcon className="h-7 w-7 text-[color:var(--px-danger)]" />}
          title="Impossible de charger les joueurs"
          description={error}
          actionLabel="Réessayer"
          onAction={() => window.location.reload()}
        />
      )}

      {/* ── Empty ── */}
      {!loading && filteredPlayers.length === 0 && !error && (
        <FeedbackState
          icon={<SearchIcon className="h-7 w-7 text-white/70" />}
          title="Aucun joueur trouvé"
          description="Aucun joueur ne correspond à tes filtres actuels."
          actionLabel="Réinitialiser les filtres"
          onAction={() => {
            setQuery("");
            setActiveLevel("Tous");
            setPositionFilter("all");
            setCityFilter("");
          }}
        />
      )}

      {/* ── Players grid ── */}
      {!loading && filteredPlayers.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {filteredPlayers.map((player, index) => {
            const name = [player.first_name, player.last_name].filter(Boolean).join(" ") || "Joueur";
            return (
              <ScrollReveal key={player.user_id} delay={index * 60}>
                <PlayerCard
                  profileHref={`/players/${player.user_id}`}
                  avatarUrl={player.avatar_url}
                  name={name}
                  level={player.level ?? "Niveau"}
                  position={player.position ?? "Poste"}
                  city={player.city ?? ""}
                  objectives={player.objectives ?? ""}
                  rating={player.rating ?? 0}
                  reviews={player.reviews_count ?? 0}
                  ageCategory={player.age_category ?? null}
                  dominantFoot={player.dominant_foot ?? null}
                  currentClub={player.current_club ?? null}
                  positionFamily={(player.position_family as PositionFamily | null) ?? null}
                  positionObjectives={[]}
                />
              </ScrollReveal>
            );
          })}
        </div>
      )}

      {/* ── CTA bottom ── */}
      <ScrollReveal>
        <section className="py-12">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 p-8 text-center sm:p-12">
            <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--px-accent)]/15 via-transparent to-[color:var(--px-accent-2)]/8" />
            <div className="relative">
              <h2 className="text-3xl text-white sm:text-4xl">
                Prêt à progresser ?{" "}
                <span className="px-gradient-text">Crée ton profil.</span>
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-white/70">
                Inscris-toi gratuitement, définis tes objectifs et trouve le coach qui te fera passer au niveau supérieur.
              </p>
              <Link href="/auth/register/player" className="px-button mt-6 inline-flex text-sm px-6 py-3">
                <BoltIcon className="h-4 w-4" />
                Créer mon profil joueur
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </AppShell>
  );
}
