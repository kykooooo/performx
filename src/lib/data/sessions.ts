import { mockCoaches, mockSessions } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { demoResult, liveResult } from "./core";
import { mapMockSessionToSessionRecord, mapSessionLikeToSessionRecord } from "./mappers";
import type { DataResult, SessionRecord } from "./types";

export type SessionsPageData = {
  userId: string | null;
  sessions: SessionRecord[];
  coachLookup: Record<string, string>;
};

type SessionRow = {
  id: string;
  coach_id: string;
  player_id: string;
  title: string;
  date: string;
  time: string;
  duration_minutes: number;
  status: SessionRecord["status"];
  feedback?: SessionRecord["feedback"];
  session_type?: string | null;
  coach?: { name?: string | null } | null;
};

export async function getSessionsPageData(): Promise<DataResult<SessionsPageData>> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  if (!userId) {
    return demoResult(
      {
        userId: null,
        sessions: mockSessions.map(mapMockSessionToSessionRecord),
        coachLookup: mockCoaches.reduce<Record<string, string>>((accumulator, coach) => {
          accumulator[coach.id] = coach.name;
          return accumulator;
        }, {}),
      },
      "unauthenticated",
    );
  }

  try {
    const { data, error } = await supabase
      .from("sessions")
      .select("id, coach_id, player_id, title, date, time, duration_minutes, status, feedback, session_type, coach:coaches(name)")
      .eq("player_id", userId)
      .order("date", { ascending: true });

    if (error) throw error;

    const sessions = (data as SessionRow[] | null)?.map((row) =>
      mapSessionLikeToSessionRecord({
        ...row,
        coachName: row.coach?.name ?? null,
      }),
    ) ?? [];

    const coachLookup = sessions.reduce<Record<string, string>>((accumulator, session) => {
      if (session.coachId && session.coachName) {
        accumulator[session.coachId] = session.coachName;
      }
      return accumulator;
    }, {});

    return liveResult({ userId, sessions, coachLookup });
  } catch {
    return demoResult(
      {
        userId,
        sessions: mockSessions.map(mapMockSessionToSessionRecord),
        coachLookup: mockCoaches.reduce<Record<string, string>>((accumulator, coach) => {
          accumulator[coach.id] = coach.name;
          return accumulator;
        }, {}),
      },
      "error",
    );
  }
}

export async function cancelSession(sessionId: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured) {
    // Demo mode: simulate cancellation
    return {};
  }

  const { error } = await supabase.rpc("cancel_session", { p_session_id: sessionId });

  if (error) {
    const code = error.message;
    if (code.includes("TOO_LATE_TO_CANCEL")) {
      return { error: "Annulation impossible moins de 24h avant la seance." };
    }
    if (code.includes("SESSION_NOT_CANCELLABLE")) {
      return { error: "Cette seance ne peut pas etre annulee." };
    }
    return { error: error.message };
  }

  return {};
}
