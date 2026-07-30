export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMonthDay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function calendarDaysInclusive(start: Date, end: Date): number {
  return Math.max(1, daysBetween(start, end) + 1);
}

/** Next occurrence of a due_day_of_month on or after `from`. */
export function nextDueDate(from: Date, dueDayOfMonth: number): Date {
  const year = from.getFullYear();
  const month = from.getMonth();
  const day = from.getDate();
  const clamped = (y: number, m: number, d: number) => {
    const last = new Date(y, m + 1, 0).getDate();
    return new Date(y, m, Math.min(d, last));
  };
  let candidate = clamped(year, month, dueDayOfMonth);
  if (candidate < new Date(year, month, day)) {
    candidate = clamped(year, month + 1, dueDayOfMonth);
  }
  return candidate;
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
