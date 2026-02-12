"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";
import PlayerCard from "@/components/player-card";
import { SearchIcon } from "@/components/icons";
import { supabase } from "@/lib/supabase";

type PlayerRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  level: string | null;
  position: string | null;
  objectives: string | null;
  avatar_url: string | null;
  rating: number | null;
  reviews_count: number | null;
};

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  useEffect(() => {
    let mounted = true;
    const fetchPlayers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("public_players")
        .select("user_id, first_name, last_name, city, level, position, objectives, avatar_url, rating, reviews_count")
        .order("rating", { ascending: false });

      if (!mounted) return;
      if (error) {
        setError(error.message);
        setPlayers([]);
      } else {
        setError(null);
        setPlayers(data ?? []);
      }
      setLoading(false);
    };

    fetchPlayers();
    return () => {
      mounted = false;
    };
  }, []);

  const levels = useMemo(
    () => Array.from(new Set(players.map((player) => player.level).filter(Boolean))) as string[],
    [players],
  );
  const positions = useMemo(
    () => Array.from(new Set(players.map((player) => player.position).filter(Boolean))) as string[],
    [players],
  );
  const cities = useMemo(
    () => Array.from(new Set(players.map((player) => player.city).filter(Boolean))) as string[],
    [players],
  );

  const filteredPlayers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return players.filter((player) => {
      const name = [player.first_name, player.last_name].filter(Boolean).join(" ").toLowerCase();
      const city = (player.city ?? "").toLowerCase();
      const position = (player.position ?? "").toLowerCase();
      const level = (player.level ?? "").toLowerCase();
      const matchesQuery = !normalized || [name, city, position, level].some((value) => value.includes(normalized));
      const matchesLevel = levelFilter === "all" || player.level === levelFilter;
      const matchesPosition = positionFilter === "all" || player.position === positionFilter;
      const matchesCity = cityFilter === "all" || player.city === cityFilter;
      return matchesQuery && matchesLevel && matchesPosition && matchesCity;
    });
  }, [players, query, levelFilter, positionFilter, cityFilter]);

  return (
    <AppShell
      active="/players"
      title="Trouver un joueur"
      description="Parcourir les profils joueurs, leurs objectifs et leurs avis."
    >
      <div className="px-card px-fade-up flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Recherche joueurs</p>
            <p className="text-xs text-white/50">Filtre par niveau, poste ou localisation.</p>
          </div>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              className="px-input pl-9"
              placeholder="Rechercher..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="px-outline p-3">
            <label className="text-[11px] uppercase tracking-[0.2em] text-white/40">Niveau</label>
            <select className="px-select mt-2" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
              <option value="all">Tous les niveaux</option>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          <div className="px-outline p-3">
            <label className="text-[11px] uppercase tracking-[0.2em] text-white/40">Poste</label>
            <select className="px-select mt-2" value={positionFilter} onChange={(event) => setPositionFilter(event.target.value)}>
              <option value="all">Tous les postes</option>
              {positions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
          <div className="px-outline p-3">
            <label className="text-[11px] uppercase tracking-[0.2em] text-white/40">Ville</label>
            <select className="px-select mt-2" value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
              <option value="all">Toutes les villes</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && <p className="text-sm text-white/50">Chargement des joueurs...</p>}
      {error && <p className="text-sm text-[color:var(--px-danger)]">{error}</p>}
      {!loading && filteredPlayers.length === 0 && !error && (
        <p className="text-sm text-white/50">Aucun joueur disponible pour le moment.</p>
      )}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {filteredPlayers.map((player, index) => {
          const name = [player.first_name, player.last_name].filter(Boolean).join(" ") || "Joueur";
          return (
            <div key={player.user_id} className="px-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
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
              />
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
