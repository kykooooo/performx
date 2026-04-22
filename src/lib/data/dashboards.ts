import {
  coachDayDistribution,
  coachMonthlyActivity,
  fetchCoachDayDistribution,
  fetchCoachMonthlyActivity,
  fetchParentChildOverview,
  fetchPlayerProgression,
  fetchPlayerSkills,
  parentOverviewFallback,
  playerProgression,
  playerSkills,
} from "@/lib/chart-data";
import { parseTextArray } from "@/lib/football";
import { mockBookings, mockCoaches, mockPlayer, mockSessions } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import type {
  ParentOverview,
  PlayerProgressionPoint,
  PlayerRadarPoint,
} from "@/lib/types";
import { normalizeUserRole } from "@/lib/roles";
import { getFeaturedCoaches } from "./coaches";
import { demoResult, liveResult } from "./core";
import {
  getMockParentChildrenRecords,
  mapMockCoachToCoachRecord,
  mapMockSessionToSessionRecord,
  mapParentChildLikeToRecord,
  mapSessionLikeToSessionRecord,
} from "./mappers";
import type {
  CoachDashboardCoachRecord,
  CoachRecord,
  DataResult,
  ParentChildRecord,
  ParentLegacyHint,
  PlayerSnapshotRecord,
  SessionRecord,
} from "./types";

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

type ParentChildProfileRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  city: string | null;
  level: string | null;
  position: string | null;
  position_family: ParentChildRecord["positionFamily"];
  age_category: ParentChildRecord["ageCategory"];
  dominant_foot: ParentChildRecord["dominantFoot"];
  current_club: string | null;
};

export type PlayerDashboardData = {
  upcoming: SessionRecord[];
  completed: SessionRecord[];
  coaches: CoachRecord[];
  coachLookup: Record<string, string>;
  totalSpent: number;
  playerSnapshot: PlayerSnapshotRecord;
  skillsData: PlayerRadarPoint[];
  progressionData: PlayerProgressionPoint[];
};

export type CoachSessionPlayerInfo = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  level: string | null;
  position: string | null;
  dominantFoot: string | null;
  currentClub: string | null;
  objectives: string | null;
  ageCategory: string | null;
};

export type CoachDashboardData = {
  coach: CoachDashboardCoachRecord | null;
  sessions: SessionRecord[];
  totalRevenue: number;
  monthRevenue: number;
  activityData: typeof coachMonthlyActivity;
  dayData: typeof coachDayDistribution;
  /** Map playerId → infos profil joueur pour les séances du coach.
   *  Permet au coach de préparer chaque séance sans cliquer. */
  playersInfo: Record<string, CoachSessionPlayerInfo>;
};

export type ParentDashboardHomeData = {
  parentName: string;
  children: ParentChildRecord[];
  coaches: CoachRecord[];
  coachCount: number;
  totalSpent: number;
  completedCount: number;
  legacyChildHint: ParentLegacyHint | null;
  error: string | null;
};

export type ParentChildInsights = {
  sessions: SessionRecord[];
  overview: ParentOverview;
};

function buildDemoCoachLookup() {
  return mockCoaches.reduce<Record<string, string>>((accumulator, coach) => {
    accumulator[coach.id] = coach.name;
    return accumulator;
  }, {});
}

function buildDemoPlayerDashboardData(): PlayerDashboardData {
  const sessions = mockSessions.map(mapMockSessionToSessionRecord);
  return {
    upcoming: sessions.filter((session) => session.status === "upcoming"),
    completed: sessions
      .filter((session) => session.status === "completed")
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
    coaches: mockCoaches.slice(0, 4).map(mapMockCoachToCoachRecord),
    coachLookup: buildDemoCoachLookup(),
    totalSpent: mockBookings.reduce((sum, booking) => sum + booking.price, 0),
    playerSnapshot: {
      currentClub: mockPlayer.currentClub ?? null,
      dominantFoot: mockPlayer.dominantFoot ?? null,
      trainingFrequencyPerWeek: mockPlayer.trainingFrequencyPerWeek ?? null,
    },
    skillsData: playerSkills,
    progressionData: playerProgression,
  };
}

function buildEmptyPlayerDashboardData(): PlayerDashboardData {
  return {
    upcoming: [],
    completed: [],
    coaches: [],
    coachLookup: {},
    totalSpent: 0,
    playerSnapshot: {
      currentClub: null,
      dominantFoot: null,
      trainingFrequencyPerWeek: null,
    },
    skillsData: [],
    progressionData: [],
  };
}

export async function getPlayerDashboardData(): Promise<DataResult<PlayerDashboardData>> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  if (!userId) {
    return demoResult(buildDemoPlayerDashboardData(), "unauthenticated");
  }

  try {
    const [sessionRes, bookingRes, featuredCoachesRes, profileRes] = await Promise.all([
      supabase
        .from("sessions")
        .select("id, coach_id, player_id, title, date, time, duration_minutes, status, feedback, session_type, coach:coaches(name)")
        .eq("player_id", userId)
        .order("date", { ascending: true }),
      supabase
        .from("bookings")
        .select("price")
        .eq("player_id", userId)
        .eq("payment_status", "paid"),
      getFeaturedCoaches(4),
      supabase
        .from("profiles")
        .select("current_club, dominant_foot, training_frequency_per_week")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (sessionRes.error) throw sessionRes.error;
    if (bookingRes.error) throw bookingRes.error;
    if (profileRes.error) throw profileRes.error;

    const sessions = ((sessionRes.data as SessionRow[] | null) ?? []).map((row) =>
      mapSessionLikeToSessionRecord({
        ...row,
        coachName: row.coach?.name ?? null,
      }),
    );

    const upcoming = sessions.filter((session) => session.status === "upcoming");
    const completed = sessions
      .filter((session) => session.status === "completed")
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

    const coachLookup = sessions.reduce<Record<string, string>>((accumulator, session) => {
      if (session.coachId && session.coachName) {
        accumulator[session.coachId] = session.coachName;
      }
      return accumulator;
    }, {});

    const [skillsData, progressionData] = await Promise.all([
      fetchPlayerSkills(userId),
      fetchPlayerProgression(userId),
    ]);

    return liveResult({
      upcoming,
      completed,
      coaches: featuredCoachesRes.data,
      coachLookup,
      totalSpent: bookingRes.data?.reduce((sum, booking) => sum + (booking.price ?? 0), 0) ?? 0,
      playerSnapshot: {
        currentClub: profileRes.data?.current_club ?? null,
        dominantFoot: profileRes.data?.dominant_foot ?? null,
        trainingFrequencyPerWeek: profileRes.data?.training_frequency_per_week ?? null,
      },
      skillsData,
      progressionData,
    });
  } catch (error) {
    console.error("[PerformX] getPlayerDashboardData failed:", error);
    return liveResult(buildEmptyPlayerDashboardData());
  }
}

function buildDemoCoachDashboardData(): CoachDashboardData {
  const demoSessions = mockSessions.map(mapMockSessionToSessionRecord);
  const demoTotal = mockBookings.reduce((sum, b) => sum + b.price, 0);
  return {
    coach: {
      id: mockCoaches[0].id,
      userId: mockCoaches[0].userId,
      name: mockCoaches[0].name,
      rating: mockCoaches[0].rating,
      pricePerSession: mockCoaches[0].pricePerSession,
      availability: mockCoaches[0].availability,
      speciality: mockCoaches[0].speciality,
      specialities: [mockCoaches[0].speciality].filter(Boolean),
    },
    sessions: demoSessions,
    totalRevenue: demoTotal,
    monthRevenue: Math.round(demoTotal * 0.3),
    activityData: coachMonthlyActivity,
    dayData: coachDayDistribution,
    playersInfo: {},
  };
}

export async function getCoachDashboardData(): Promise<DataResult<CoachDashboardData>> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  if (!userId) {
    return demoResult(buildDemoCoachDashboardData(), "unauthenticated");
  }

  try {
    const { data: coachData, error: coachError } = await supabase
      .from("coaches")
      .select("id, user_id, name, rating, price_per_session, availability, speciality, specialities")
      .eq("user_id", userId)
      .maybeSingle();

    if (coachError) throw coachError;
    if (!coachData) {
      return liveResult({
        coach: null,
        sessions: [],
        totalRevenue: 0,
        monthRevenue: 0,
        activityData: [],
        dayData: [],
        playersInfo: {},
      });
    }

    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);
    const firstOfMonthIso = firstOfMonth.toISOString();

    const [{ data: sessionData, error: sessionError }, bookingsTotalRes, bookingsMonthRes] = await Promise.all([
      supabase
        .from("sessions")
        .select("id, coach_id, player_id, title, date, time, duration_minutes, status, feedback, session_type")
        .eq("coach_id", coachData.id)
        .order("date", { ascending: true }),
      supabase
        .from("bookings")
        .select("price")
        .eq("coach_id", coachData.id)
        .eq("payment_status", "paid"),
      supabase
        .from("bookings")
        .select("price")
        .eq("coach_id", coachData.id)
        .eq("payment_status", "paid")
        .gte("created_at", firstOfMonthIso),
    ]);

    if (sessionError) throw sessionError;

    const totalRevenue = (bookingsTotalRes.data ?? []).reduce(
      (sum, booking) => sum + (booking.price ?? 0),
      0,
    );
    const monthRevenue = (bookingsMonthRes.data ?? []).reduce(
      (sum, booking) => sum + (booking.price ?? 0),
      0,
    );

    const [activityData, dayData] = await Promise.all([
      fetchCoachMonthlyActivity(coachData.id),
      fetchCoachDayDistribution(coachData.id),
    ]);

    // Récupère les profils des joueurs inscrits aux séances du coach
    // (utile pour le coach qui veut préparer sans cliquer sur chaque séance).
    const playerIds = Array.from(
      new Set(
        ((sessionData as SessionRow[] | null) ?? [])
          .map((s) => s.player_id)
          .filter(Boolean),
      ),
    );

    const playersInfo: Record<string, CoachSessionPlayerInfo> = {};
    if (playerIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select(
          "user_id, first_name, last_name, birth_date, level, position, dominant_foot, current_club, objectives, age_category",
        )
        .in("user_id", playerIds);

      for (const row of profilesData ?? []) {
        const uid = row.user_id as string;
        playersInfo[uid] = {
          userId: uid,
          firstName: (row.first_name as string | null) ?? null,
          lastName: (row.last_name as string | null) ?? null,
          birthDate: (row.birth_date as string | null) ?? null,
          level: (row.level as string | null) ?? null,
          position: (row.position as string | null) ?? null,
          dominantFoot: (row.dominant_foot as string | null) ?? null,
          currentClub: (row.current_club as string | null) ?? null,
          objectives: (row.objectives as string | null) ?? null,
          ageCategory: (row.age_category as string | null) ?? null,
        };
      }
    }

    return liveResult({
      coach: {
        id: coachData.id,
        userId: coachData.user_id,
        name: coachData.name,
        rating: coachData.rating,
        pricePerSession: coachData.price_per_session,
        availability: coachData.availability ?? [],
        speciality: coachData.speciality ?? "Coach",
        specialities: parseTextArray(coachData.specialities as string[] | string | null),
      },
      sessions: ((sessionData as SessionRow[] | null) ?? []).map(mapSessionLikeToSessionRecord),
      totalRevenue,
      monthRevenue,
      activityData,
      dayData,
      playersInfo,
    });
  } catch (error) {
    console.error("[PerformX] getCoachDashboardData failed:", error);
    return liveResult({
      coach: null,
      sessions: [],
      totalRevenue: 0,
      monthRevenue: 0,
      activityData: [],
      dayData: [],
      playersInfo: {},
    });
  }
}

function buildLegacyHint(metadata: Record<string, unknown>): ParentLegacyHint | null {
  if (!metadata.child_first_name) return null;
  return {
    firstName: String(metadata.child_first_name ?? ""),
    lastName: String(metadata.child_last_name ?? ""),
    birthDate: typeof metadata.child_birth_date === "string" ? metadata.child_birth_date : null,
    level: typeof metadata.child_level === "string" ? metadata.child_level : null,
    position: typeof metadata.child_position === "string" ? metadata.child_position : null,
  };
}

function buildDemoParentHomeData(): ParentDashboardHomeData {
  return {
    parentName: "Marie Dupont",
    children: getMockParentChildrenRecords(),
    coaches: mockCoaches.slice(0, 4).map(mapMockCoachToCoachRecord),
    coachCount: mockCoaches.length,
    totalSpent: mockBookings.reduce((sum, booking) => sum + booking.price, 0),
    completedCount: mockSessions.filter((session) => session.status === "completed").length,
    legacyChildHint: null,
    error: null,
  };
}

export async function getParentDashboardHomeData(): Promise<DataResult<ParentDashboardHomeData>> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user ?? null;

  if (!user) {
    return demoResult(buildDemoParentHomeData(), "unauthenticated");
  }

  try {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role, first_name, last_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    const role = normalizeUserRole(profileData?.role ?? null);
    if (role !== "parent") {
      return liveResult({
        parentName: "",
        children: [],
        coaches: [],
        coachCount: 0,
        totalSpent: 0,
        completedCount: 0,
        legacyChildHint: buildLegacyHint(user.user_metadata ?? {}),
        error: "Acces reserve aux comptes parent.",
      });
    }

    const { data: links, error: linksError } = await supabase
      .from("parent_children")
      .select("child_user_id")
      .eq("parent_user_id", user.id);

    if (linksError) throw linksError;

    const childIds = (links ?? []).map((link) => link.child_user_id as string);
    const featuredCoachesRes = await getFeaturedCoaches(4);
    if (childIds.length === 0) {
      return liveResult({
        parentName:
          [profileData?.first_name, profileData?.last_name].filter(Boolean).join(" ") || "Parent",
        children: [],
        coaches: featuredCoachesRes.data,
        coachCount: featuredCoachesRes.data.length,
        totalSpent: 0,
        completedCount: 0,
        legacyChildHint: buildLegacyHint(user.user_metadata ?? {}),
        error: null,
      });
    }

    const [childrenRes, bookingsRes, sessionsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, first_name, last_name, birth_date, city, level, position, position_family, age_category, dominant_foot, current_club")
        .in("user_id", childIds),
      supabase
        .from("bookings")
        .select("price, player_id")
        .in("player_id", childIds)
        .eq("payment_status", "paid"),
      supabase
        .from("sessions")
        .select("id, status, player_id")
        .in("player_id", childIds),
    ]);

    if (childrenRes.error) throw childrenRes.error;
    if (bookingsRes.error) throw bookingsRes.error;
    if (sessionsRes.error) throw sessionsRes.error;

    return liveResult({
      parentName:
        [profileData?.first_name, profileData?.last_name].filter(Boolean).join(" ") || "Parent",
      children: ((childrenRes.data as ParentChildProfileRow[] | null) ?? []).map(
        mapParentChildLikeToRecord,
      ),
      coaches: featuredCoachesRes.data,
      coachCount: featuredCoachesRes.data.length,
      totalSpent:
        bookingsRes.data?.reduce((sum, booking) => sum + (booking.price ?? 0), 0) ?? 0,
      completedCount:
        sessionsRes.data?.filter((session) => session.status === "completed").length ?? 0,
      legacyChildHint: buildLegacyHint(user.user_metadata ?? {}),
      error: null,
    });
  } catch (error) {
    console.error("[PerformX] getParentDashboardHomeData failed:", error);
    return liveResult({
      parentName:
        [user.user_metadata?.first_name as string | undefined, user.user_metadata?.last_name as string | undefined]
          .filter(Boolean)
          .join(" ") || "Parent",
      children: [],
      coaches: [],
      coachCount: 0,
      totalSpent: 0,
      completedCount: 0,
      legacyChildHint: buildLegacyHint(user.user_metadata ?? {}),
      error: null,
    });
  }
}

export async function getParentChildInsights(
  childId: string | null,
  mode: "live" | "demo",
): Promise<ParentChildInsights> {
  if (!childId) {
    return {
      sessions: [],
      overview: parentOverviewFallback,
    };
  }

  if (mode === "demo") {
    return {
      sessions: mockSessions
        .filter((session) => session.playerId === mockPlayer.id || childId === mockPlayer.id)
        .map(mapMockSessionToSessionRecord),
      overview: parentOverviewFallback,
    };
  }

  const { data: sessionData } = await supabase
    .from("sessions")
    .select("id, coach_id, player_id, title, date, time, duration_minutes, status, feedback, session_type")
    .eq("player_id", childId)
    .order("date", { ascending: true });

  const overview = await fetchParentChildOverview(childId);

  return {
    sessions: ((sessionData as SessionRow[] | null) ?? []).map(mapSessionLikeToSessionRecord),
    overview,
  };
}
