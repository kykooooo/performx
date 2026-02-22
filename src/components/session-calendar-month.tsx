import { addDays, startOfWeek, toISODate } from "@/lib/date";
import type { Session } from "@/lib/types";

type Props = {
  monthStart: Date;
  sessions: Session[];
  coachLookup: Record<string, string>;
};

const DAY_HEADERS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function SessionCalendarMonth({ monthStart, sessions, coachLookup }: Props) {
  const todayKey = toISODate(new Date());
  const month = monthStart.getMonth();

  // Build 6-week grid starting from the Monday before (or on) the 1st
  const gridStart = startOfWeek(monthStart);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(addDays(gridStart, i));
  }

  // Trim trailing full weeks outside the month
  while (cells.length > 35) {
    const lastWeekStart = cells.length - 7;
    if (cells[lastWeekStart].getMonth() !== month) {
      cells.splice(lastWeekStart, 7);
    } else break;
  }

  return (
    <div className="px-card p-4" role="region" aria-label="Calendrier mensuel des séances">
      {/* Header */}
      <div className="grid grid-cols-7 gap-px mb-2">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="py-2 text-center text-[10px] uppercase tracking-[0.2em] text-white/40">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((date) => {
          const key = toISODate(date);
          const isCurrentMonth = date.getMonth() === month;
          const isToday = key === todayKey;
          const daySessions = sessions.filter((s) => s.date === key);

          return (
            <div
              key={key}
              className={`min-h-[80px] rounded-xl border p-2 transition sm:min-h-[100px] ${
                isToday
                  ? "border-[color:var(--px-accent)]/40 bg-[color:var(--px-accent)]/10"
                  : isCurrentMonth
                    ? "border-white/5 bg-white/[0.02]"
                    : "border-transparent bg-transparent opacity-30"
              }`}
            >
              <div
                className={`text-xs font-medium ${
                  isToday ? "text-[color:var(--px-accent)]" : "text-white/50"
                }`}
              >
                {date.getDate()}
              </div>
              <div className="mt-1 space-y-1">
                {daySessions.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-lg border border-[color:var(--px-accent)]/30 bg-[color:var(--px-accent)]/15 px-1.5 py-1 text-[10px] leading-tight"
                  >
                    <p className="font-semibold text-white truncate">{event.title}</p>
                    <p className="text-white/50 hidden sm:block">
                      {event.time} · {coachLookup[event.coachId] ?? "Coach"}
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
