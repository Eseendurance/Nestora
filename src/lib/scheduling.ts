export const DEFAULT_TIME_ZONE = 'Africa/Lagos';
export const DEFAULT_START_MINUTES = 9 * 60;
export const DEFAULT_END_MINUTES = 17 * 60;
export const DEFAULT_BUFFER_MINUTES = 15;
export const DEFAULT_MAX_BOOKINGS_PER_DAY = 8;
export const APPOINTMENT_DURATION_MINUTES = 30;

const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
};

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
};

function getParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const weekday = WEEKDAYS[values.weekday];

  if (weekday === undefined) throw new RangeError('Unsupported weekday.');

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    weekday
  };
}

export function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch (error) {
    if (error instanceof RangeError) return false;
    throw error;
  }
}

export function getLocalDateKey(date: Date, timeZone: string): string {
  const { year, month, day } = getParts(date, timeZone);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getLocalWeekday(date: Date, timeZone: string): number {
  return getParts(date, timeZone).weekday;
}

export function getLocalMinutes(date: Date, timeZone: string): number {
  const { hour, minute } = getParts(date, timeZone);
  return hour * 60 + minute;
}

export function addCalendarDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function getWeekdayFromDateKey(dateKey: string): number {
  return new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
}

export function fromZonedDateTime(dateKey: string, minutes: number, timeZone: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let timestamp = target;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = getParts(new Date(timestamp), timeZone);
    const represented = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    const correction = target - represented;
    if (correction === 0) break;
    timestamp += correction;
  }

  const result = new Date(timestamp);
  const finalParts = getParts(result, timeZone);
  if (
    finalParts.year !== year ||
    finalParts.month !== month ||
    finalParts.day !== day ||
    finalParts.hour !== hour ||
    finalParts.minute !== minute
  ) {
    throw new RangeError('The selected time does not exist in this time zone.');
  }

  return result;
}

export function formatLocalTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(date);
}
