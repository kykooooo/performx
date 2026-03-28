import { supabase } from "./supabase";
import type { ParentOverview, PlayerProgressionPoint, PlayerRadarPoint } from "./types";

export const CHART_COLORS = {
  accent: "#ff6a00",
  accentLight: "#ff8a33",
  success: "#22c55e",
  warning: "#f59e0b",
  muted: "rgba(255,255,255,0.2)",
  grid: "rgba(150,150,150,0.15)",
  tick: "rgba(150,150,150,0.6)",
};

export const coachMonthlyActivity = [
  { month: "Oct", seances: 8, revenus: 320 },
  { month: "Nov", seances: 12, revenus: 480 },
  { month: "Dec", seances: 10, revenus: 400 },
  { month: "Jan", seances: 15, revenus: 600 },
  { month: "Fev", seances: 18, revenus: 720 },
  { month: "Mar", seances: 22, revenus: 880 },
];

export const coachDayDistribution = [
  { day: "Lun", count: 5 },
  { day: "Mar", count: 8 },
  { day: "Mer", count: 12 },
  { day: "Jeu", count: 6 },
  { day: "Ven", count: 9 },
  { day: "Sam", count: 14 },
  { day: "Dim", count: 3 },
];

export const playerSkills: PlayerRadarPoint[] = [
  { skill: "Technique", value: 78 },
  { skill: "Tactique", value: 74 },
  { skill: "Physique", value: 71 },
  { skill: "Intensite", value: 83 },
  { skill: "Mental", value: 80 },
];

export const playerProgression: PlayerProgressionPoint[] = [
  { month: "Oct", score: 54 },
  { month: "Nov", score: 59 },
  { month: "Dec", score: 63 },
  { month: "Jan", score: 69 },
  { month: "Fev", score: 75 },
  { month: "Mar", score: 81 },
];

export const parentOverviewFallback: ParentOverview = {
  attendance: 85,
  progression: 72,
  lastLoadRecommendation: "normal",
  nextFocus: "Continuer le jeu entre les lignes et la qualité du premier contrôle.",
};

export function buildParentMetricBars(overview: ParentOverview) {
  return [
    { label: "Assiduite", value: overview.attendance, color: "#ff6a00" },
    { label: "Progression", value: overview.progression, color: "#22c55e" },
    {
      label: "Charge",
      value:
        overview.lastLoadRecommendation === "recover"
          ? 35
          : overview.lastLoadRecommendation === "lighten"
            ? 60
            : 85,
      color:
        overview.lastLoadRecommendation === "recover"
          ? "#ef4444"
          : overview.lastLoadRecommendation === "lighten"
            ? "#f59e0b"
            : "#22c55e",
    },
  ];
}

export async function fetchCoachMonthlyActivity(coachId: string) {
  try {
    const { data } = await supabase.rpc("get_coach_monthly_activity", { p_coach_id: coachId });
    return data && data.length > 0 ? data : coachMonthlyActivity;
  } catch {
    return coachMonthlyActivity;
  }
}

export async function fetchCoachDayDistribution(coachId: string) {
  try {
    const { data } = await supabase.rpc("get_coach_day_distribution", { p_coach_id: coachId });
    return data && data.length > 0 ? data : coachDayDistribution;
  } catch {
    return coachDayDistribution;
  }
}

export async function fetchPlayerProgression(playerId: string): Promise<PlayerProgressionPoint[]> {
  try {
    const { data } = await supabase.rpc("get_player_progression", { p_player_id: playerId });
    return data && data.length > 0 ? data : playerProgression;
  } catch {
    return playerProgression;
  }
}

export async function fetchPlayerSkills(playerId: string): Promise<PlayerRadarPoint[]> {
  try {
    const { data } = await supabase.rpc("get_player_skills", { p_player_id: playerId });
    return data && data.length > 0 ? data : playerSkills;
  } catch {
    return playerSkills;
  }
}

export async function fetchParentChildOverview(playerId: string): Promise<ParentOverview> {
  try {
    const { data } = await supabase.rpc("get_parent_child_overview", { p_player_id: playerId });
    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      return {
        attendance: Number(row.attendance ?? 0),
        progression: Number(row.progression ?? 0),
        lastLoadRecommendation: row.last_load_recommendation ?? "normal",
        nextFocus: row.next_focus ?? parentOverviewFallback.nextFocus,
      };
    }
  } catch {
    return parentOverviewFallback;
  }
  return parentOverviewFallback;
}

export async function fetchParentMetrics(playerId: string) {
  const overview = await fetchParentChildOverview(playerId);
  return buildParentMetricBars(overview);
}
