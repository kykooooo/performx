export function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = (day + 6) % 7; // Monday start
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function toISODate(date: Date) {
  // IMPORTANT : on reste en heure locale pour éviter le shift UTC qui,
  // aux fuseaux +01/+02, faisait régulièrement "glisser" un lundi
  // local sur un dimanche UTC (décalage visible de +1 jour sur les
  // agendas). date.toISOString() passe par UTC et cause ce bug ; ici
  // on construit la chaîne YYYY-MM-DD directement avec les getters
  // locaux.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(date);
}

export function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(date);
}

export function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);
}

export function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}
