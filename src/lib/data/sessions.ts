import { mockCoaches, mockSessions } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
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
      .select("id, coach_id, player_id, title, date, time, duration_minutes, status, feedback, coach:coaches(name)")
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
