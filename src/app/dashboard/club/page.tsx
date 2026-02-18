"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import { formatLongDate } from "@/lib/date";
import { supabase } from "@/lib/supabase";

type CoachRow = {
  id: string;
  name: string;
  speciality: string;
  rating: number | null;
};

type SessionRow = {
  id: string;
  title: string;
  date: string;
  time: string;
};

export default function ClubDashboardPage() {
  const [coachCount, setCoachCount] = useState<number>(0);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [players, setPlayers] = useState<{ user_id: string; first_name: string | null; last_name: string | null; city: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError("Connecte-toi pour accéder au dashboard parent.");
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userData.user.id)
        .single();

      const role = profileData?.role ?? null;
      if (role !== "club") {
        setError("Accès réservé aux comptes parent.");
        setLoading(false);
        return;
      }

      const { data: coachData, count: coachTotal, error: coachError } = await supabase
        .from("public_coaches")
        .select("id, name, speciality, rating", { count: "exact" });

      const { data: sessionData, count: sessionTotal, error: sessionError } = await supabase
        .from("sessions")
        .select("id, title, date, time", { count: "exact" })
        .order("date", { ascending: true })
        .limit(3);

      const { data: playerData } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, city")
        .eq("role", "player")
        .order("created_at", { ascending: false })
        .limit(6);

      if (!mounted) return;
      if (coachError || sessionError) {
        setError(coachError?.message ?? sessionError?.message ?? "Accès refusé.");
      }
      setCoachCount(coachTotal ?? coachData?.length ?? 0);
      setSessionCount(sessionTotal ?? sessionData?.length ?? 0);
      setCoaches((coachData ?? []).slice(0, 4));
      setSessions(sessionData ?? []);
      setPlayers(playerData ?? []);
      setLoading(false);
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppShell
      active="/dashboard"
      title="Dashboard Parent"
      description="Suivi des joueurs, séances réservées et coachs partenaires."
    >
      {error && (
        <div className="px-card p-6">
          <p className="text-sm text-[color:var(--px-danger)]">{error}</p>
          {error.includes("Connecte-toi") && (
            <Link href="/auth/login" className="px-button mt-4">Se connecter</Link>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Joueurs actifs", value: players.length || "-" },
              { label: "Séances semaine", value: sessionCount },
              { label: "Coachs partenaires", value: coachCount },
            ].map((stat) => (
              <div key={stat.label} className="px-card p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="px-card p-6">
            <h3 className="text-lg text-white">Séances à venir</h3>
            <div className="mt-4 space-y-3">
              {loading && <p className="text-xs text-white/50">Chargement...</p>}
              {!loading && sessions.length === 0 && (
                <p className="text-xs text-white/50">Aucune séance programmée.</p>
              )}
              {sessions.map((session) => (
                <div key={session.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                  <p className="text-white">{session.title}</p>
                  <p className="text-xs text-white/50">
                    {formatLongDate(new Date(`${session.date}T12:00`))} · {session.time}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="px-card-strong p-6">
            <h3 className="text-lg text-white">Top coachs partenaires</h3>
            <div className="mt-4 space-y-3">
              {coaches.map((coach) => (
                <div
                  key={coach.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm"
                >
                  <div>
                    <p className="text-white">{coach.name}</p>
                    <p className="text-xs text-white/50">{coach.speciality}</p>
                  </div>
                  <span className="text-[color:var(--px-accent)]">{(coach.rating ?? 0).toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="px-card p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg text-white">Joueurs récents</h3>
              <span className="px-pill">{players.length}</span>
            </div>
            <div className="mt-4 space-y-3">
              {players.map((player) => (
                <div
                  key={player.user_id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm"
                >
                  <div>
                    <p className="text-white">{[player.first_name, player.last_name].filter(Boolean).join(" ") || "Joueur"}</p>
                    <p className="text-xs text-white/50">{player.city ?? "Ville inconnue"}</p>
                  </div>
                  <button className="px-button-ghost" type="button">Voir</button>
                </div>
              ))}
              {!loading && players.length === 0 && (
                <p className="text-xs text-white/50">Aucun joueur enregistré.</p>
              )}
            </div>
          </div>
          <div className="px-card p-6">
            <h3 className="text-lg text-white">Actions parent</h3>
            <div className="mt-4 grid gap-3">
              <button className="px-button" type="button">Réserver une nouvelle séance</button>
              <button className="px-button-ghost" type="button">Contacter un coach</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
