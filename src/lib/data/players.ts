import { mockPlayerReviews, mockPlayers } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { withPublicFallback, demoResult, liveResult } from "./core";
import { mapMockPlayerToPlayerRecord, mapPlayerLikeToPlayerRecord } from "./mappers";
import type { DataResult, PlayerRecord } from "./types";

export const PUBLIC_PLAYER_SELECT =
  "user_id, first_name, last_name, city, level, position, position_family, objectives, dominant_foot, current_club, age_category, avatar_url, rating, reviews_count";

function getMockPlayerDirectory() {
  return mockPlayers.map(mapMockPlayerToPlayerRecord);
}

export async function getPlayerDirectory() {
  return withPublicFallback({
    loadLive: async () => {
      const { data, error } = await supabase
        .from("public_players")
        .select(PUBLIC_PLAYER_SELECT)
        .order("rating", { ascending: false });

      if (error) throw error;
      return (data ?? []).map(mapPlayerLikeToPlayerRecord);
    },
    loadDemo: getMockPlayerDirectory,
    isEmpty: (rows) => rows.length === 0,
  });
}

export async function getPlayerPublicProfileData(playerId: string): Promise<
  DataResult<{ player: PlayerRecord | null; reviews: typeof mockPlayerReviews }>
> {
  const mockPlayer = mockPlayers.find((player) => player.id === playerId);
  const mockData = {
    player: mockPlayer ? mapMockPlayerToPlayerRecord(mockPlayer) : null,
    reviews: mockPlayerReviews.filter((review) => review.playerId === playerId),
  };

  try {
    const [playerRes, reviewsRes] = await Promise.all([
      supabase
        .from("public_players")
        .select(PUBLIC_PLAYER_SELECT)
        .eq("user_id", playerId)
        .maybeSingle(),
      supabase
        .from("public_player_reviews")
        .select("id, player_id, coach_name, rating, comment, date")
        .eq("player_id", playerId)
        .order("date", { ascending: false }),
    ]);

    if (playerRes.error) throw playerRes.error;
    if (!playerRes.data) {
      return mockData.player ? demoResult(mockData, "empty-live") : liveResult({ player: null, reviews: [] });
    }

    return liveResult({
      player: mapPlayerLikeToPlayerRecord(playerRes.data),
      reviews:
        (reviewsRes.data ?? []).map((review) => ({
          id: review.id,
          playerId: review.player_id,
          coach_name: review.coach_name ?? "Coach",
          rating: review.rating,
          comment: review.comment ?? "",
          date: review.date,
        })) ?? [],
    });
  } catch {
    return demoResult(mockData, "error");
  }
}
