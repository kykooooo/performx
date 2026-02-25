import { addDays, formatDayLabel, formatShortDate, toISODate } from "@/lib/date";
import type { Session } from "@/lib/types";

type SessionCalendarProps = {
  weekStart: Date;
  sessions: Session[];
  coachLookup: Record<string, string>;
};

export default function SessionCalendar({ weekStart, sessions, coachLookup }: SessionCalendarProps) {
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
    <div className="px-card p-4" role="region" aria-label="Calendrier des séances">
      <div className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-7 lg:overflow-visible lg:pb-0">
        {days.map((item) => {
          const isToday = item.dateKey === todayKey;
          const daySessions = sessions.filter((session) => session.date === item.dateKey);
          return (
            <div
              key={item.dateKey}
              className={`min-w-[220px] rounded-2xl border border-white/10 p-3 lg:min-w-0 lg:border-r lg:border-white/10 lg:p-0 lg:pr-3 lg:last:border-r-0 ${
                isToday ? "border-[color:var(--px-accent)]/40 bg-[color:var(--px-accent)]/10 lg:rounded-none lg:border-[color:var(--px-accent)]/40 lg:p-2" : "bg-white/[0.03]"
              }`}
            >
              <div className="text-xs uppercase tracking-[0.2em] text-white/70">{item.short}</div>
              <div className="mt-1 text-sm text-white">{formatDayLabel(item.date)}</div>
              <div className="mt-3 flex min-h-[120px] flex-col gap-3 lg:min-h-[220px]">
                {daySessions.length === 0 && (
                  <span className="text-xs text-white/70">Aucune séance</span>
                )}
                {daySessions.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/15 p-3 text-xs shadow-[0_12px_25px_rgba(0,0,0,0.25)]"
                  >
                    <p className="text-sm font-semibold text-white">{event.title}</p>
                    <p className="text-white/70">{event.time}</p>
                    <p className="mt-2 text-[11px] text-white/70">
                      {coachLookup[event.coachId] ?? "Coach"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
