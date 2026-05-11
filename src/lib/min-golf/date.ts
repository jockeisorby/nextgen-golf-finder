import { addDays, endOfWeek, format, startOfWeek } from "date-fns";
import { sv } from "date-fns/locale";

const ISO_DATE = "yyyy-MM-dd";

export function todayIso() {
  return format(new Date(), ISO_DATE);
}

export function defaultToIso() {
  return format(addDays(new Date(), 30), ISO_DATE);
}

export function defaultDateRange() {
  return {
    from: todayIso(),
    to: defaultToIso(),
  };
}

export function upcomingWeekendRange(fromDate = new Date()) {
  const saturday = startOfWeek(addDays(fromDate, 6), {
    weekStartsOn: 6,
  });
  const sunday = endOfWeek(saturday, {
    weekStartsOn: 1,
  });

  return {
    from: format(saturday, ISO_DATE),
    to: format(sunday, ISO_DATE),
  };
}

export function formatDateLabel(value?: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "d MMM yyyy", { locale: sv });
}
