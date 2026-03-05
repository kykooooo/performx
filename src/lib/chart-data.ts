// ── Shared chart colors & mock data for all dashboards ──

export const CHART_COLORS = {
  accent: "#ff6a00",
  accentLight: "#ff8a33",
  success: "#22c55e",
  warning: "#f59e0b",
  muted: "rgba(255,255,255,0.2)",
  grid: "rgba(150,150,150,0.15)",
  tick: "rgba(150,150,150,0.6)",
};

// ── Coach data ──

export const coachMonthlyActivity = [
  { month: "Oct", seances: 8, revenus: 320 },
  { month: "Nov", seances: 12, revenus: 480 },
  { month: "Déc", seances: 10, revenus: 400 },
  { month: "Jan", seances: 15, revenus: 600 },
  { month: "Fév", seances: 18, revenus: 720 },
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

// ── Player data ──

export const playerSkills = [
  { skill: "Technique", value: 78 },
  { skill: "Vitesse", value: 65 },
  { skill: "Endurance", value: 82 },
  { skill: "Tactique", value: 70 },
  { skill: "Mental", value: 88 },
];

export const playerProgression = [
  { month: "Oct", score: 52 },
  { month: "Nov", score: 58 },
  { month: "Déc", score: 61 },
  { month: "Jan", score: 68 },
  { month: "Fév", score: 74 },
  { month: "Mar", score: 79 },
];

// ── Parent data ──

export const parentMetrics = [
  { label: "Assiduité", value: 85, color: "#ff6a00" },
  { label: "Progression", value: 72, color: "#22c55e" },
  { label: "Satisfaction", value: 96, color: "#f59e0b" },
];
