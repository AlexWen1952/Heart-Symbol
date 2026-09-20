export function toLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addLocalDays(dateString: string, days: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day + days, 12);
  return toLocalDateString(date);
}

export function localDateFromTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? '' : toLocalDateString(date);
}

export function isDateBefore(left: string, right: string): boolean {
  return left < right;
}

export function calculateStreak(dateStrings: string[], today = toLocalDateString()): number {
  const dates = new Set(dateStrings.filter(Boolean));
  let cursor = dates.has(today) ? today : addLocalDays(today, -1);
  let streak = 0;
  while (dates.has(cursor)) {
    streak += 1;
    cursor = addLocalDays(cursor, -1);
  }
  return streak;
}

export function getLocalMonthDays(date = new Date()): string[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const total = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: total }, (_, index) => (
    toLocalDateString(new Date(year, month, index + 1, 12))
  ));
}
