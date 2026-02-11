import { describe, expect, it } from "vitest";
import { createSessionBooking, isSlotAvailable } from "@/lib/booking";
import type { AvailabilitySlot, Coach, Session } from "@/lib/types";

const coach: Coach = {
  id: "coach_1",
  userId: "user_1",
  name: "Coach Test",
  speciality: "Tir",
  bio: "",
  location: "Paris",
  pricePerSession: 45,
  rating: 4.5,
  reviews: 12,
  availability: [],
};

const slot: AvailabilitySlot = {
  date: "2026-02-20",
  time: "10:00",
  durationMinutes: 60,
};

describe("booking utils", () => {
  it("refuse un créneau déjà réservé", () => {
    const sessions: Session[] = [
      {
        id: "session_1",
        coachId: "coach_1",
        playerId: "player_1",
        title: "Séance privée",
        date: "2026-02-20",
        time: "10:00",
        durationMinutes: 60,
        status: "upcoming",
      },
    ];

    expect(isSlotAvailable("coach_1", slot, sessions)).toBe(false);
    const result = createSessionBooking({ coach, playerId: "player_2", slot, sessions });
    expect("error" in result).toBe(true);
  });

  it("crée une session + booking sur un créneau libre", () => {
    const sessions: Session[] = [];
    const result = createSessionBooking({ coach, playerId: "player_2", slot, sessions });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.session.coachId).toBe(coach.id);
    expect(result.booking.price).toBe(coach.pricePerSession);
  });
});
