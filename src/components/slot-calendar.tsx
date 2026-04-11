"use client";

import { addDays, formatDayLabel, formatShortDate, toISODate } from "@/lib/date";

type Slot = {
  date: string;
  time: string;
  durationMinutes: number;
};

type SlotCalendarProps = {
  slots: Slot[];
  selectedSlot: { date: string; time: string } | null;
  onSelectSlot: (slot: Slot) => void;
  weekStart: Date;
};

export default function SlotCalendar({ slots, selectedSlot, onSelectSlot, weekStart }: SlotCalendarProps) {
  const todayKey = toISODate(new Date());
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return {
      date,
      dateKey: toISODate(date),
      short: formatShortDate(date),
    };
  });

  return (
    <div className="px-card p-4" role="region" aria-label="Calendrier des creneaux">
      <div className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-7 lg:overflow-visible lg:pb-0">
        {days.map((item) => {
          const isToday = item.dateKey === todayKey;
          const daySlots = slots
            .filter((slot) => slot.date === item.dateKey)
            .sort((a, b) => a.time.localeCompare(b.time));

          return (
            <div
              key={item.dateKey}
              className={`min-w-[140px] rounded-2xl border border-white/10 p-3 lg:min-w-0 lg:border-r lg:border-white/10 lg:p-0 lg:pr-3 lg:last:border-r-0 ${
                isToday
                  ? "border-[color:var(--px-accent)]/40 bg-[color:var(--px-accent)]/10 lg:rounded-none lg:border-[color:var(--px-accent)]/40 lg:p-2"
                  : "bg-white/[0.03]"
              }`}
            >
              <div className="text-xs uppercase tracking-[0.2em] text-white/70">{item.short}</div>
              <div className="mt-1 text-sm text-white">{formatDayLabel(item.date)}</div>
              <div className="mt-3 flex min-h-[120px] flex-col gap-2 lg:min-h-[180px]">
                {daySlots.length === 0 && (
                  <span className="text-xs text-white/70">Aucun creneau</span>
                )}
                {daySlots.map((slot) => {
                  const isSelected =
                    selectedSlot?.date === slot.date && selectedSlot?.time === slot.time;

                  return (
                    <button
                      key={`${slot.date}-${slot.time}`}
                      type="button"
                      aria-pressed={isSelected}
                      className={`rounded-xl border px-3 py-2 text-left text-xs transition duration-200 ${
                        isSelected
                          ? "border-[color:var(--px-accent)] bg-[color:var(--px-accent)]/15 text-white shadow-[0_12px_25px_rgba(0,0,0,0.25)]"
                          : "border-white/10 bg-white/5 text-white/80 hover:border-[color:var(--px-accent)] hover:bg-white/10"
                      }`}
                      onClick={() => onSelectSlot(slot)}
                    >
                      <span className="font-semibold">{slot.time}</span>
                      <span className="ml-1 text-white/55">{slot.durationMinutes}min</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
