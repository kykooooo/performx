import type { AvailabilitySlot, Booking, Coach, Session } from "./types";

let idCounter = 100;

const normalizeTime = (value: string) => {
  if (!value) return value;
  return value.length >= 5 ? value.slice(0, 5) : value;
};

const createId = (prefix: string) => {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
};

export function isSlotAvailable(coachId: string, slot: AvailabilitySlot, sessions: Session[]) {
  return !sessions.some(
    (session) =>
      session.coachId === coachId &&
      session.date === slot.date &&
      normalizeTime(session.time) === normalizeTime(slot.time) &&
      session.status !== "cancelled",
  );
}

export function getAvailableSlots(coach: Coach | undefined, sessions: Session[]) {
  if (!coach) return [] as AvailabilitySlot[];
  return coach.availability.filter((slot) => isSlotAvailable(coach.id, slot, sessions));
}

type BookingInput = {
  coach: Coach;
  playerId: string;
  slot: AvailabilitySlot;
  sessions: Session[];
};

export function createSessionBooking({ coach, playerId, slot, sessions }: BookingInput) {
  if (!isSlotAvailable(coach.id, slot, sessions)) {
    return { error: "Ce créneau vient d'être réservé." } as const;
  }

  const session: Session = {
    id: createId("session"),
    coachId: coach.id,
    playerId,
    title: `Séance privée · ${coach.speciality}`,
    date: slot.date,
    time: slot.time,
    durationMinutes: slot.durationMinutes,
    status: "upcoming",
  };

  const booking: Booking = {
    id: createId("booking"),
    sessionId: session.id,
    playerId,
    coachId: coach.id,
    createdAt: new Date().toISOString(),
    price: coach.pricePerSession,
    paymentStatus: "paid",
  };

  return { session, booking } as const;
}
