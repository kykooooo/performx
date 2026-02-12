"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PublicStats = {
  coaches: number;
  players: number;
  sessions: number;
  coachRating: number;
  playerRating: number;
};

const formatNumber = (value: number) => {
  if (value >= 1000) return `${Math.round(value / 100) / 10}k`;
  return value.toString();
};

const average = (values: number[]) => {
  if (values.length === 0) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
};

export default function PublicStats() {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      const { data: coachesData } = await supabase.from("public_coaches").select("rating");
      const { data: playersData } = await supabase.from("public_players").select("rating");
      const { count: sessionsCount } = await supabase
        .from("public_sessions")
        .select("coach_id", { count: "exact", head: true });

      if (!mounted) return;
      const coachRatings = (coachesData ?? []).map((row) => row.rating ?? 0);
      const playerRatings = (playersData ?? []).map((row) => row.rating ?? 0);

      setStats({
        coaches: (coachesData ?? []).length,
        players: (playersData ?? []).length,
        sessions: sessionsCount ?? 0,
        coachRating: average(coachRatings),
        playerRating: average(playerRatings),
      });
    };

    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  const items = [
    {
      label: "Coachs actifs",
      value: stats ? formatNumber(stats.coaches) : "—",
    },
    {
      label: "Joueurs actifs",
      value: stats ? formatNumber(stats.players) : "—",
    },
    {
      label: "Seances reservees",
      value: stats ? formatNumber(stats.sessions) : "—",
    },
    {
      label: "Note coachs",
      value: stats ? stats.coachRating.toFixed(1) : "—",
    },
    {
      label: "Note joueurs",
      value: stats ? stats.playerRating.toFixed(1) : "—",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((stat) => (
        <div key={stat.label} className="px-outline p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">{stat.label}</p>
          <p className="text-2xl font-semibold text-white">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
