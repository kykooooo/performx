import { supabase } from "@/lib/supabase";

// MVP admin email list — extend or replace with profiles.role === 'admin' check
const ADMIN_EMAILS = [
  "kyky76700@gmail.com",
];

export type AdminCoachRecord = {
  id: string;
  userId: string | null;
  name: string;
  speciality: string;
  diplomas: string[];
  verified: boolean;
  createdAt: string;
  avatarUrl: string | null;
};

export type AdminStats = {
  coaches: number;
  players: number;
  sessions: number;
  bookings: number;
};

/**
 * Check if the current user has admin privileges.
 * First checks profiles.role === 'admin', then falls back to hardcoded email list.
 */
export async function checkIsAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Check hardcoded email list (MVP fallback)
  if (user.email && ADMIN_EMAILS.includes(user.email)) return true;

  // Check role in profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return profile?.role === "admin";
}

/**
 * Fetch dashboard statistics: total counts from main tables.
 */
export async function getAdminDashboardStats(): Promise<AdminStats> {
  const [coachesRes, playersRes, sessionsRes, bookingsRes] = await Promise.all([
    supabase.from("coaches").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("role", "player"),
    supabase.from("sessions").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
  ]);

  return {
    coaches: coachesRes.count ?? 0,
    players: playersRes.count ?? 0,
    sessions: sessionsRes.count ?? 0,
    bookings: bookingsRes.count ?? 0,
  };
}

/**
 * Fetch all coaches for admin review, ordered by creation date (newest first).
 */
export async function getCoachesForReview(): Promise<AdminCoachRecord[]> {
  const { data, error } = await supabase
    .from("coaches")
    .select("id, user_id, name, speciality, diplomas, verified, created_at, avatar_url")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id ?? null,
    name: row.name ?? "Coach",
    speciality: row.speciality ?? "Coach",
    diplomas: Array.isArray(row.diplomas)
      ? row.diplomas
      : typeof row.diplomas === "string" && row.diplomas.trim()
        ? row.diplomas.split(",").map((d: string) => d.trim())
        : [],
    verified: row.verified ?? false,
    createdAt: row.created_at,
    avatarUrl: row.avatar_url ?? null,
  }));
}

/**
 * Update a coach's verified status.
 */
export async function verifyCoach(coachId: string, verified: boolean): Promise<void> {
  const { error } = await supabase
    .from("coaches")
    .update({ verified })
    .eq("id", coachId);

  if (error) throw error;
}
