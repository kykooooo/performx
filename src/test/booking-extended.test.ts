import { describe, expect, it } from "vitest";
import {
  createSessionBooking,
  getAvailableSlots,
  isSlotAvailable,
  normalizeTime,
} from "@/lib/booking";
import type { AvailabilitySlot, Coach, Session } from "@/lib/types";

const makeCoach = (overrides?: Partial<Coach>): Coach => ({
  id: "coach_1",
  userId: "user_1",
  name: "Coach Test",
  speciality: "Tir",
  bio: "",
  location: "Paris",
  pricePerSession: 45,
  rating: 4.5,
  reviews: 12,
  availability: [
    { date: "2026-03-01", time: "10:00", durationMinutes: 60 },
    { date: "2026-03-01", time: "14:00", durationMinutes: 60 },
    { date: "2026-03-02", time: "09:00", durationMinutes: 90 },
  ],
  ...overrides,
});

const makeSession = (overrides?: Partial<Session>): Session => ({
  id: "session_1",
  coachId: "coach_1",
  playerId: "player_1",
  title: "Séance privée",
  date: "2026-03-01",
  time: "10:00",
  durationMinutes: 60,
  status: "upcoming",
  ...overrides,
});

describe("normalizeTime", () => {
  it("tronque un temps avec secondes", () => {
    expect(normalizeTime("10:00:00")).toBe("10:00");
  });

  it("laisse intact un temps court", () => {
    expect(normalizeTime("9:00")).toBe("9:00");
  });

  it("gère un temps déjà normalisé", () => {
    expect(normalizeTime("14:30")).toBe("14:30");
  });

  it("retourne une chaîne vide inchangée", () => {
    expect(normalizeTime("")).toBe("");
  });
});

describe("isSlotAvailable", () => {
  it("retourne true si aucune session ne bloque le créneau", () => {
    const slot: AvailabilitySlot = { date: "2026-03-01", time: "14:00", durationMinutes: 60 };
    expect(isSlotAvailable("coach_1", slot, [])).toBe(true);
  });

  it("retourne false si une session upcoming existe", () => {
    const slot: AvailabilitySlot = { date: "2026-03-01", time: "10:00", durationMinutes: 60 };
    expect(isSlotAvailable("coach_1", slot, [makeSession()])).toBe(false);
  });

  it("retourne true si la session est annulée", () => {
    const slot: AvailabilitySlot = { date: "2026-03-01", time: "10:00", durationMinutes: 60 };
    expect(isSlotAvailable("coach_1", slot, [makeSession({ status: "cancelled" })])).toBe(true);
  });

  it("retourne true si c'est un autre coach", () => {
    const slot: AvailabilitySlot = { date: "2026-03-01", time: "10:00", durationMinutes: 60 };
    expect(isSlotAvailable("coach_2", slot, [makeSession()])).toBe(true);
  });

  it("gère normalizeTime avec secondes", () => {
    const slot: AvailabilitySlot = { date: "2026-03-01", time: "10:00", durationMinutes: 60 };
    const session = makeSession({ time: "10:00:00" });
    expect(isSlotAvailable("coach_1", slot, [session])).toBe(false);
  });
});

describe("getAvailableSlots", () => {
  it("retourne tous les créneaux si aucune session", () => {
    const coach = makeCoach();
    expect(getAvailableSlots(coach, [])).toHaveLength(3);
  });

  it("filtre les créneaux réservés", () => {
    const coach = makeCoach();
    const sessions = [makeSession()];
    const slots = getAvailableSlots(coach, sessions);
    expect(slots).toHaveLength(2);
    expect(slots.every((s) => s.time !== "10:00" || s.date !== "2026-03-01")).toBe(true);
  });

  it("retourne un tableau vide si pas de coach", () => {
    expect(getAvailableSlots(undefined, [])).toHaveLength(0);
  });
});

describe("createSessionBooking", () => {
  it("retourne une erreur si le créneau est pris", () => {
    const coach = makeCoach();
    const slot: AvailabilitySlot = { date: "2026-03-01", time: "10:00", durationMinutes: 60 };
    const result = createSessionBooking({
      coach,
      playerId: "player_2",
      slot,
      sessions: [makeSession()],
    });
    expect("error" in result).toBe(true);
  });

  it("crée session et booking correctement", () => {
    const coach = makeCoach();
    const slot: AvailabilitySlot = { date: "2026-03-02", time: "09:00", durationMinutes: 90 };
    const result = createSessionBooking({ coach, playerId: "player_2", slot, sessions: [] });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.session.coachId).toBe("coach_1");
    expect(result.session.playerId).toBe("player_2");
    expect(result.session.durationMinutes).toBe(90);
    expect(result.session.status).toBe("upcoming");
    expect(result.booking.price).toBe(45);
    expect(result.booking.paymentStatus).toBe("paid");
    expect(result.booking.sessionId).toBe(result.session.id);
  });

  it("génère des IDs uniques pour chaque réservation", () => {
    const coach = makeCoach();
    const slot1: AvailabilitySlot = { date: "2026-03-01", time: "14:00", durationMinutes: 60 };
    const slot2: AvailabilitySlot = { date: "2026-03-02", time: "09:00", durationMinutes: 90 };
    const r1 = createSessionBooking({ coach, playerId: "p1", slot: slot1, sessions: [] });
    const r2 = createSessionBooking({ coach, playerId: "p2", slot: slot2, sessions: [] });
    if ("error" in r1 || "error" in r2) return;
    expect(r1.session.id).not.toBe(r2.session.id);
    expect(r1.booking.id).not.toBe(r2.booking.id);
  });
});
