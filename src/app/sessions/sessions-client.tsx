"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";
import { FeedbackState, LoadingState } from "@/components/feedback-state";
import SessionCalendar from "@/components/session-calendar";
import SessionCalendarMonth from "@/components/session-calendar-month";
import { CalendarIcon, InboxIcon } from "@/components/icons";
import { addDays, addMonths, formatLongDate, formatMonthYear, startOfMonth, startOfWeek } from "@/lib/date";
import { supabase } from "@/lib/supabase";
import { mockSessions, mockCoaches } from "@/lib/mock-data";
import type { Session } from "@/lib/types";

const normalizeTime = (value: string) => (value.length >= 5 ? value.slice(0, 5) : value);

type SessionRow = {
  id: string;
  coach_id: string;
  player_id: string;
  title: string;
  date: string;
  time: string;
  duration_minutes: number;
  status: "upcoming" | "completed" | "cancelled";
  coach?: { name: string } | null;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [coachLookup, setCoachLookup] = useState<Record<string, string>>({});
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()));
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchSessions = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setUserId(null);
        setSessions(mockSessions);
        const lookup: Record<string, string> = {};
        mockCoaches.forEach((c) => { lookup[c.id] = c.name; });
        setCoachLookup(lookup);
        setLoading(false);
        return;
      }
      setUserId(userData.user.id);

      const { data } = await supabase
        .from("sessions")
        .select("id, coach_id, player_id, title, date, time, duration_minutes, status, coach:coaches(name)")
        .eq("player_id", userData.user.id)
        .order("date", { ascending: true });

      if (!mounted) return;
      const mapped = (data as SessionRow[] | null)?.map((row) => ({
        id: row.id,
        coachId: row.coach_id,
        playerId: row.player_id,
        title: row.title,
        date: row.date,
        time: normalizeTime(row.time),
        durationMinutes: row.duration_minutes,
        status: row.status,
      })) ?? [];

      if (mapped.length > 0) {
        setSessions(mapped);
        const lookup: Record<string, string> = {};
        (data as SessionRow[] | null)?.forEach((row) => {
          if (row.coach_id) {
            lookup[row.coach_id] = row.coach?.name ?? "Coach";
          }
        });
        setCoachLookup(lookup);
      } else {
        setSessions(mockSessions);
        const lookup: Record<string, string> = {};
        mockCoaches.forEach((c) => { lookup[c.id] = c.name; });
        setCoachLookup(lookup);
      }
      setLoading(false);
    };

    fetchSessions();
    return () => {
      mounted = false;
    };
  }, []);

  const upcomingSessions = useMemo(
    () => sessions.filter((session) => session.status === "upcoming"),
    [sessions],
  );
  const pastSessions = useMemo(
    () => sessions.filter((session) => session.status === "completed"),
    [sessions],
  );

  return (
    <AppShell active="/sessions" title="Mes séances" description="Suivi de tes réservations et de ton planning.">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="px-stack-3">
          <div className="px-card-strong px-fade-up p-4">
            <h3 className="text-lg text-white">Réserver une séance</h3>
            <p className="mt-2 text-xs text-white/60">
              Accède à la réservation automatique et choisis un coach disponible.
            </p>
            <Link href="/booking" className="px-button mt-4 w-full">
              Aller à la réservation
            </Link>
          </div>
          <div className="px-card px-fade-up p-4" style={{ animationDelay: "80ms" }}>
            <h3 className="text-lg text-white">Mes prochaines séances</h3>
            <div className="mt-4 space-y-3">
              {loading && <LoadingState title="Chargement des séances" description="Récupération des prochaines séances..." />}
              {!loading && upcomingSessions.length === 0 && (
                <FeedbackState
                  icon={<CalendarIcon className="h-7 w-7 text-white/35" />}
                  title="Aucune séance à venir"
                  description="Tu n'as pas encore de réservation future."
                  actionLabel="Réserver maintenant"
                  actionHref="/booking"
                />
              )}
              {upcomingSessions.map((session) => (
                <div key={session.id} className="rounded-xl border border-white/10 bg-white/5 p-3 transition duration-200 hover:border-[color:var(--px-accent)]/30">
                  <p className="text-sm font-semibold text-white">{session.title}</p>
                  <p className="text-xs text-white/60">{coachLookup[session.coachId] ?? "Coach"}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-white/50">
                    <span>{formatLongDate(new Date(`${session.date}T12:00`))}</span>
                    <span>{session.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="px-card px-fade-up p-4" style={{ animationDelay: "160ms" }}>
            <h3 className="text-lg text-white">Mes séances passées</h3>
            <div className="mt-4 space-y-3">
              {!loading && pastSessions.length === 0 && (
                <FeedbackState
                  icon={<InboxIcon className="h-7 w-7 text-white/35" />}
                  title="Aucune séance passée"
                  description="Tes séances terminées apparaîtront ici."
                />
              )}
              {pastSessions.map((session) => (
                <div key={session.id} className="rounded-xl border border-white/10 bg-white/5 p-3 transition duration-200 hover:border-[color:var(--px-accent)]/30">
                  <p className="text-sm font-semibold text-white">{session.title}</p>
                  <p className="text-xs text-white/60">Le {formatLongDate(new Date(`${session.date}T12:00`))}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-[color:var(--px-accent)]">
                    <span>★★★★★</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-stack-2 px-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/70">
              {viewMode === "week" ? (
                <>
                  <button
                    className="px-button-ghost"
                    type="button"
                    onClick={() => setWeekStart((prev) => addDays(prev, -7))}
                  >
                    ◀
                  </button>
                  <span className="px-pill">Semaine du {formatLongDate(weekStart)}</span>
                  <button
                    className="px-button-ghost"
                    type="button"
                    onClick={() => setWeekStart((prev) => addDays(prev, 7))}
                  >
                    ▶
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="px-button-ghost"
                    type="button"
                    onClick={() => setMonthStart((prev) => addMonths(prev, -1))}
                  >
                    ◀
                  </button>
                  <span className="px-pill capitalize">{formatMonthYear(monthStart)}</span>
                  <button
                    className="px-button-ghost"
                    type="button"
                    onClick={() => setMonthStart((prev) => addMonths(prev, 1))}
                  >
                    ▶
                  </button>
                </>
              )}
            </div>
            <select
              className="px-select max-w-[180px]"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as "week" | "month")}
            >
              <option value="week">Vue semaine</option>
              <option value="month">Vue mois</option>
            </select>
          </div>
          {viewMode === "week" ? (
            <SessionCalendar weekStart={weekStart} sessions={upcomingSessions} coachLookup={coachLookup} />
          ) : (
            <SessionCalendarMonth monthStart={monthStart} sessions={upcomingSessions} coachLookup={coachLookup} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
