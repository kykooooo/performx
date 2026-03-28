import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDashboardPathForRole, normalizeUserRole } from "@/lib/roles";

describe("roles", () => {
  it("normalise l'ancien role club en parent", () => {
    expect(normalizeUserRole("club")).toBe("parent");
    expect(getDashboardPathForRole("club")).toBe("/dashboard/parent");
  });
});

describe("shared data layer", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("retombe sur le demo pour l'annuaire coach si le live est vide", async () => {
    const query = {
      data: [],
      error: null,
      select() {
        return this;
      },
      order() {
        return this;
      },
      limit() {
        return this;
      },
    };

    vi.doMock("@/lib/supabase", () => ({
      isSupabaseConfigured: true,
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
        from: vi.fn(() => query),
        rpc: vi.fn(),
      },
    }));

    const { getCoachDirectory } = await import("@/lib/data/coaches");
    const result = await getCoachDirectory(4);

    expect(result.mode).toBe("demo");
    expect(result.fallbackReason).toBe("empty-live");
    expect(result.data).toHaveLength(4);
  });

  it("renvoie le dashboard joueur en demo si aucun utilisateur n'est connecte", async () => {
    vi.doMock("@/lib/supabase", () => ({
      isSupabaseConfigured: true,
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
        from: vi.fn(),
        rpc: vi.fn(),
      },
    }));

    const { getPlayerDashboardData } = await import("@/lib/data/dashboards");
    const result = await getPlayerDashboardData();

    expect(result.mode).toBe("demo");
    expect(result.fallbackReason).toBe("unauthenticated");
    expect(result.data.upcoming.length).toBeGreaterThan(0);
    expect(result.data.coaches.length).toBeGreaterThan(0);
  });

  it("renvoie le dashboard coach en demo si aucun utilisateur n'est connecte", async () => {
    vi.doMock("@/lib/supabase", () => ({
      isSupabaseConfigured: true,
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
        from: vi.fn(),
        rpc: vi.fn(),
      },
    }));

    const { getCoachDashboardData } = await import("@/lib/data/dashboards");
    const result = await getCoachDashboardData();

    expect(result.mode).toBe("demo");
    expect(result.fallbackReason).toBe("unauthenticated");
    expect(result.data.coach?.name).toBeTruthy();
    expect(result.data.sessions.length).toBeGreaterThan(0);
  });

  it("renvoie le dashboard parent en demo si aucun utilisateur n'est connecte", async () => {
    vi.doMock("@/lib/supabase", () => ({
      isSupabaseConfigured: true,
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
        from: vi.fn(),
        rpc: vi.fn(),
      },
    }));

    const { getParentDashboardHomeData } = await import("@/lib/data/dashboards");
    const result = await getParentDashboardHomeData();

    expect(result.mode).toBe("demo");
    expect(result.fallbackReason).toBe("unauthenticated");
    expect(result.data.children.length).toBeGreaterThan(0);
    expect(result.data.coaches.length).toBeGreaterThan(0);
  });

  it("renvoie la messagerie demo si aucun utilisateur n'est connecte", async () => {
    vi.doMock("@/lib/supabase", () => ({
      isSupabaseConfigured: true,
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
        from: vi.fn(),
        rpc: vi.fn(),
      },
    }));

    const { getMessagesInboxData } = await import("@/lib/data/messages");
    const result = await getMessagesInboxData();

    expect(result.mode).toBe("demo");
    expect(result.fallbackReason).toBe("unauthenticated");
    expect(result.data.conversations.length).toBeGreaterThan(0);
    expect(result.data.activeConversationId).toBeTruthy();
  });

  it("bloque la reservation si aucun utilisateur n'est connecte", async () => {
    vi.doMock("@/lib/supabase", () => ({
      isSupabaseConfigured: false,
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
        from: vi.fn(),
        rpc: vi.fn(),
      },
    }));

    const { createBookingReservation } = await import("@/lib/data/booking");
    const result = await createBookingReservation({
      coachId: "coach_1",
      slot: { date: "2026-03-31", time: "18:00", durationMinutes: 60 },
      userId: null,
    });

    expect(result).toEqual({ error: "Connecte-toi pour reserver une seance." });
  });

  it("cree une reservation locale coherente en mode demo", async () => {
    vi.doMock("@/lib/supabase", () => ({
      isSupabaseConfigured: false,
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
        from: vi.fn(),
        rpc: vi.fn(),
      },
    }));

    const { createBookingReservation } = await import("@/lib/data/booking");
    const result = await createBookingReservation({
      coachId: "coach_1",
      slot: { date: "2026-04-01", time: "18:00", durationMinutes: 60 },
      userId: "player_test",
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.bookingId).toBeTruthy();
    expect(result.sessionId).toBeTruthy();
    expect(result.conversationId).toBeNull();
  });
});

describe("player profile mapping", () => {
  it("aligne le champ departement avec la persistence existante", async () => {
    const {
      buildPlayerProfileMetadata,
      createEmptyPlayerProfileValues,
      mapPlayerProfileRecordToValues,
    } = await import("@/lib/player-profile");

    const values = mapPlayerProfileRecordToValues({
      first_name: "Alex",
      city: "76 - Seine-Maritime",
    });

    expect(values.department).toBe("76 - Seine-Maritime");

    const metadata = buildPlayerProfileMetadata({
      ...createEmptyPlayerProfileValues(),
      firstName: "Alex",
      department: "76 - Seine-Maritime",
      positionObjectives: ["Orientation du corps"],
    });

    expect(metadata.department).toBe("76 - Seine-Maritime");
    expect(metadata.city).toBe("76 - Seine-Maritime");
  });
});
