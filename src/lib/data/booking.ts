import { createSessionBooking, normalizeTime } from "@/lib/booking";
import { mockBookings, mockCoaches, mockSessions } from "@/lib/mock-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getCoachDirectory } from "./coaches";
import { demoResult, liveResult } from "./core";
import {
  mapBookingLikeToBookingRecord,
  mapMockBookingToBookingRecord,
} from "./mappers";
import type { AvailabilitySlot } from "@/lib/types";
import type { BookingRecord, CoachRecord, DataResult } from "./types";

export type BookingPageData = {
  userId: string | null;
  coaches: CoachRecord[];
  bookings: BookingRecord[];
};

type BookingRpcRow = {
  session_id: string;
  booking_id: string;
  conversation_id: string | null;
};

export async function getBookingPageData(): Promise<DataResult<BookingPageData>> {
  const [coachData, userRes] = await Promise.all([
    getCoachDirectory(),
    supabase.auth.getUser(),
  ]);

  const userId = userRes.data.user?.id ?? null;

  if (!userId) {
    return demoResult(
      {
        userId: null,
        coaches: coachData.data,
        bookings: mockBookings.slice(0, 3).map(mapMockBookingToBookingRecord),
      },
      "unauthenticated",
    );
  }

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, session_id, player_id, coach_id, created_at, price, payment_status")
      .eq("player_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return liveResult({
      userId,
      coaches: coachData.data,
      bookings: (data ?? []).map(mapBookingLikeToBookingRecord),
    });
  } catch {
    return demoResult(
      {
        userId,
        coaches: coachData.data,
        bookings: mockBookings.slice(0, 3).map(mapMockBookingToBookingRecord),
      },
      "error",
    );
  }
}

export async function getReservedCoachSessions(coachId: string) {
  try {
    const { data, error } = await supabase
      .from("public_sessions")
      .select("date, time, status")
      .eq("coach_id", coachId);

    if (error) throw error;

    return liveResult(
      (data ?? []).map((row) => ({
        date: row.date,
        time: normalizeTime(row.time),
        status: row.status,
      })),
    );
  } catch {
    return demoResult(
      mockSessions
        .filter((session) => session.coachId === coachId)
        .map((session) => ({
          date: session.date,
          time: normalizeTime(session.time),
          status: session.status,
        })),
      "error",
    );
  }
}

export async function createBookingReservation(options: {
  coachId: string;
  slot: AvailabilitySlot;
  userId: string | null;
}): Promise<
  | { error: string }
  | { bookingId: string; conversationId: string | null; sessionId: string }
> {
  if (!options.userId) {
    return { error: "Connecte-toi pour reserver une seance." } as const;
  }

  if (!isSupabaseConfigured) {
    const coach = mockCoaches.find((entry) => entry.id === options.coachId);
    if (!coach) {
      return { error: "Coach introuvable." } as const;
    }

    const result = createSessionBooking({
      coach,
      playerId: options.userId,
      slot: options.slot,
      sessions: mockSessions,
    });

    if ("error" in result) {
      return { error: result.error ?? "Impossible de reserver." };
    }

    return {
      bookingId: result.booking.id,
      conversationId: null,
      sessionId: result.session.id,
    } as const;
  }

  const { data, error } = await supabase
    .rpc("create_booking_with_conversation", {
      p_coach_id: options.coachId,
      p_date: options.slot.date,
      p_time: normalizeTime(options.slot.time),
      p_duration_minutes: options.slot.durationMinutes,
    })
    .single();

  if (error || !data) {
    return {
      error:
        error?.message?.includes("SLOT_ALREADY_BOOKED")
          ? "Ce creneau vient d'etre reserve. Choisis un autre horaire."
          : error?.message ?? "Impossible de reserver.",
    } as const;
  }

  const bookingData = data as BookingRpcRow;
  return {
    bookingId: bookingData.booking_id,
    conversationId: bookingData.conversation_id,
    sessionId: bookingData.session_id,
  } as const;
}
