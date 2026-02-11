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
    <div className="px-card grid grid-cols-1 gap-4 p-4 lg:grid-cols-7">
      {days.map((item) => {
        const isToday = item.dateKey === todayKey;
        const daySessions = sessions.filter((session) => session.date === item.dateKey);
        return (
          <div
            key={item.dateKey}
            className={`flex min-h-[220px] flex-col gap-3 border-white/10 lg:border-r lg:pr-3 lg:last:border-r-0 ${
              isToday ? "rounded-2xl border border-[color:var(--px-accent)]/40 bg-[color:var(--px-accent)]/10 p-2" : ""
            }`}
          >
            <div className="text-xs uppercase tracking-[0.2em] text-white/40">{item.short}</div>
            <div className="text-sm text-white">{formatDayLabel(item.date)}</div>
            <div className="flex flex-1 flex-col gap-3">
              {daySessions.length === 0 && (
                <span className="text-xs text-white/30">Aucune séance</span>
              )}
              {daySessions.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/15 p-3 text-xs shadow-[0_12px_25px_rgba(0,0,0,0.25)]"
                >
                  <p className="text-sm font-semibold text-white">{event.title}</p>
                  <p className="text-white/60">{event.time}</p>
                  <p className="mt-2 text-[11px] text-white/50">
                    {coachLookup[event.coachId] ?? "Coach"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
