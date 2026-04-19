import { mockCoaches, mockReviews } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import type { Review } from "@/lib/types";
import { withPublicFallback, demoResult, liveResult } from "./core";
import { mapCoachLikeToCoachRecord, mapMockCoachToCoachRecord } from "./mappers";
import type { CoachRecord, DataResult } from "./types";

export const PUBLIC_COACH_SELECT =
  "id, user_id, name, speciality, specialities, accepted_age_categories, service_radius_km, intervention_locations, bio, location, department, price_per_session, rating, reviews_count, availability, avatar_url, diplomas, experience_years, certifications, focus_areas, session_formats, pedagogy";

export const COACH_PAGE_SIZE = 12;

function getMockCoachDirectory(limit?: number) {
  const rows = mockCoaches.map(mapMockCoachToCoachRecord);
  return typeof limit === "number" ? rows.slice(0, limit) : rows;
}

export async function getCoachDirectory(limit?: number) {
  return withPublicFallback({
    loadLive: async () => {
      let query = supabase.from("public_coaches").select(PUBLIC_COACH_SELECT).order("rating", {
        ascending: false,
      });
      if (typeof limit === "number") {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapCoachLikeToCoachRecord);
    },
    loadDemo: () => getMockCoachDirectory(limit),
    isEmpty: (rows) => rows.length === 0,
  });
}

export async function getCoachDirectoryPaginated(page: number, pageSize = COACH_PAGE_SIZE) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  return withPublicFallback({
    loadLive: async () => {
      const { data, error, count } = await supabase
        .from("public_coaches")
        .select(PUBLIC_COACH_SELECT, { count: "exact" })
        .order("rating", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return {
        items: (data ?? []).map(mapCoachLikeToCoachRecord),
        total: count ?? 0,
        hasMore: (count ?? 0) > to + 1,
      };
    },
    loadDemo: () => {
      const all = getMockCoachDirectory();
      return {
        items: all.slice(from, to + 1),
        total: all.length,
        hasMore: all.length > to + 1,
      };
    },
    isEmpty: (result) => result.items.length === 0 && page === 0,
  });
}

export async function getFeaturedCoaches(limit = 4) {
  return getCoachDirectory(limit);
}

export async function getCoachProfileData(coachId: string): Promise<
  DataResult<{ coach: CoachRecord | null; reviews: Review[] }>
> {
  const mockCoach = mockCoaches.find((coach) => coach.id === coachId);
  const mockData = {
    coach: mockCoach ? mapMockCoachToCoachRecord(mockCoach) : null,
    reviews: mockReviews.filter((review) => review.coachId === coachId),
  };

  try {
    const [coachRes, reviewsRes] = await Promise.all([
      supabase
        .from("public_coaches")
        .select(PUBLIC_COACH_SELECT)
        .eq("id", coachId)
        .maybeSingle(),
      supabase
        .from("public_reviews")
        .select("id, coach_id, player_name, rating, comment, date")
        .eq("coach_id", coachId)
        .order("date", { ascending: false }),
    ]);

    if (coachRes.error) throw coachRes.error;
    if (!coachRes.data) {
      return mockData.coach ? demoResult(mockData, "empty-live") : liveResult({ coach: null, reviews: [] });
    }

    return liveResult({
      coach: mapCoachLikeToCoachRecord(coachRes.data),
      reviews:
        (reviewsRes.data ?? []).map((review) => ({
          id: review.id,
          coachId: review.coach_id,
          playerName: review.player_name ?? "Joueur",
          rating: review.rating,
          comment: review.comment ?? "",
          date: review.date,
        })) ?? [],
    });
  } catch {
    return demoResult(mockData, "error");
  }
}

export async function getCoachIdMapByUserIds(userIds: string[]) {
  if (userIds.length === 0) return {} as Record<string, string>;
  const { data } = await supabase
    .from("coaches")
    .select("id, user_id")
    .in("user_id", userIds);

  return (data ?? []).reduce<Record<string, string>>((accumulator, coach) => {
    if (coach.user_id) {
      accumulator[coach.user_id] = coach.id;
    }
    return accumulator;
  }, {});
}
