"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/app-shell";
import { FeedbackState, LoadingState } from "@/components/feedback-state";
import SessionCalendar from "@/components/session-calendar";
import SessionCalendarMonth from "@/components/session-calendar-month";
import { CalendarIcon, InboxIcon } from "@/components/icons";
import {
  addDays,
  addMonths,
  formatLongDate,
  formatMonthYear,
  startOfMonth,
  startOfWeek,
} from "@/lib/date";
import { getSessionsPageData } from "@/lib/data/sessions";
import type { SessionRecord } from "@/lib/data/types";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [coachLookup, setCoachLookup] = useState<Record<string, string>>({});
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()));
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchSessions = async () => {
      setLoading(true);
      const result = await getSessionsPageData();
      if (!mounted) return;
      setSessions(result.data.sessions);
      setCoachLookup(result.data.coachLookup);
      setIsDemo(result.mode === "demo");
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
    <AppShell
      active="/sessions"
      title="Mes seances"
      description="Suivi de tes reservations et de ton planning."
    >
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="px-stack-3">
          <div className="px-card-strong px-fade-up p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg text-white">Reserver une seance</h3>
                <p className="mt-2 text-xs text-white/70">
                  Accede a la reservation automatique et choisis un coach disponible.
                </p>
              </div>
              {isDemo && <span className="px-pill">Mode demo</span>}
            </div>
            <Link href="/booking" className="px-button mt-4 w-full">
              Aller a la reservation
            </Link>
          </div>
          <div className="px-card px-fade-up p-4" style={{ animationDelay: "80ms" }}>
            <h3 className="text-lg text-white">Mes prochaines seances</h3>
            <div className="mt-4 space-y-3">
              {loading && (
                <LoadingState
                  title="Chargement des seances"
                  description="Recuperation des prochaines seances..."
                />
              )}
              {!loading && upcomingSessions.length === 0 && (
                <FeedbackState
                  icon={<CalendarIcon className="h-7 w-7 text-white/35" />}
                  title="Aucune seance a venir"
                  description="Tu n&apos;as pas encore de reservation future."
                  actionLabel="Reserver maintenant"
                  actionHref="/booking"
                />
              )}
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 transition duration-200 hover:border-[color:var(--px-accent)]/30"
                >
                  <p className="text-sm font-semibold text-white">{session.title}</p>
                  <p className="text-xs text-white/70">
                    {coachLookup[session.coachId] ?? session.coachName ?? "Coach"}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-white/70">
                    <span>{formatLongDate(new Date(`${session.date}T12:00`))}</span>
                    <span>{session.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="px-card px-fade-up p-4" style={{ animationDelay: "160ms" }}>
            <h3 className="text-lg text-white">Mes seances passees</h3>
            <div className="mt-4 space-y-3">
              {!loading && pastSessions.length === 0 && (
                <FeedbackState
                  icon={<InboxIcon className="h-7 w-7 text-white/35" />}
                  title="Aucune seance passee"
                  description="Tes seances terminees apparaitront ici."
                />
              )}
              {pastSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 transition duration-200 hover:border-[color:var(--px-accent)]/30"
                >
                  <p className="text-sm font-semibold text-white">{session.title}</p>
                  <p className="text-xs text-white/70">
                    Le {formatLongDate(new Date(`${session.date}T12:00`))}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-[color:var(--px-accent)]">
                    <span>*****</span>
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
                    onClick={() => setWeekStart((previous) => addDays(previous, -7))}
                  >
                    {"<"}
                  </button>
                  <span className="px-pill">Semaine du {formatLongDate(weekStart)}</span>
                  <button
                    className="px-button-ghost"
                    type="button"
                    onClick={() => setWeekStart((previous) => addDays(previous, 7))}
                  >
                    {">"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="px-button-ghost"
                    type="button"
                    onClick={() => setMonthStart((previous) => addMonths(previous, -1))}
                  >
                    {"<"}
                  </button>
                  <span className="px-pill capitalize">{formatMonthYear(monthStart)}</span>
                  <button
                    className="px-button-ghost"
                    type="button"
                    onClick={() => setMonthStart((previous) => addMonths(previous, 1))}
                  >
                    {">"}
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-button-ghost px-3 py-2 text-xs"
                onClick={() => {
                  if (viewMode === "week") setWeekStart(startOfWeek(new Date()));
                  else setMonthStart(startOfMonth(new Date()));
                }}
              >
                Aujourd&apos;hui
              </button>
              <select
                className="px-select max-w-[180px]"
                value={viewMode}
                onChange={(event) => setViewMode(event.target.value as "week" | "month")}
              >
                <option value="week">Vue semaine</option>
                <option value="month">Vue mois</option>
              </select>
            </div>
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
