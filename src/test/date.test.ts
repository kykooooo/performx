import { describe, expect, it } from "vitest";
import { addDays, formatDayLabel, formatLongDate, formatShortDate, startOfWeek, toISODate } from "@/lib/date";

describe("startOfWeek", () => {
  it("retourne le lundi pour un mercredi", () => {
    const wed = new Date("2026-02-25T12:00:00"); // mercredi
    const monday = startOfWeek(wed);
    expect(monday.getDay()).toBe(1); // lundi
    expect(monday.getDate()).toBe(23);
  });

  it("retourne le même jour si c'est lundi", () => {
    const mon = new Date("2026-02-23T12:00:00"); // lundi
    const result = startOfWeek(mon);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(23);
  });

  it("retourne le lundi précédent pour un dimanche", () => {
    const sun = new Date("2026-03-01T12:00:00"); // dimanche
    const result = startOfWeek(sun);
    expect(result.getDay()).toBe(1);
  });

  it("met les heures à minuit", () => {
    const date = new Date("2026-02-25T15:30:00");
    const result = startOfWeek(date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });
});

describe("addDays", () => {
  it("ajoute des jours correctement", () => {
    const date = new Date("2026-02-20T12:00:00");
    expect(toISODate(addDays(date, 1))).toBe("2026-02-21");
    expect(toISODate(addDays(date, 7))).toBe("2026-02-27");
  });

  it("gère le passage de mois", () => {
    const date = new Date("2026-02-28T12:00:00");
    expect(toISODate(addDays(date, 1))).toBe("2026-03-01");
  });

  it("gère des jours négatifs", () => {
    const date = new Date("2026-03-01T12:00:00");
    expect(toISODate(addDays(date, -1))).toBe("2026-02-28");
  });
});

describe("toISODate", () => {
  it("formate correctement une date", () => {
    const date = new Date("2026-01-15T12:00:00Z");
    expect(toISODate(date)).toBe("2026-01-15");
  });
});

describe("formatDayLabel", () => {
  it("retourne un jour en français", () => {
    const monday = new Date("2026-02-23T12:00:00");
    const label = formatDayLabel(monday);
    expect(label.toLowerCase()).toBe("lundi");
  });
});

describe("formatShortDate", () => {
  it("formate en jour mois court", () => {
    const date = new Date("2026-02-20T12:00:00");
    const formatted = formatShortDate(date);
    expect(formatted).toContain("20");
  });
});

describe("formatLongDate", () => {
  it("formate en JJ/MM/AAAA", () => {
    const date = new Date("2026-02-20T12:00:00");
    const formatted = formatLongDate(date);
    expect(formatted).toContain("2026");
    expect(formatted).toContain("20");
  });
});
