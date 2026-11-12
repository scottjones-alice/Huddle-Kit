/**
 * Works out the dates of a repeating event series. Pure functions with no
 * database access, so they are easy to test.
 *
 * A series stores a local wall-clock time (18:00) and an IANA time zone
 * ("Europe/London"). Each occurrence is converted to a UTC instant on its own
 * date, so 18:00 stays 18:00 local across daylight saving changes.
 *
 * Edge cases: a local time that does not exist (the clocks go forward over it)
 * moves to the same offset as just before the change, which lands an hour
 * later on the clock. A local time that happens twice (the clocks go back)
 * uses the later of the two.
 */

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;
const ISO_SUNDAY = 7;
const MAX_OCCURRENCES = 1000;

export interface SeriesRule {
  durationMinutes: number;
  endsOn: string | null;
  generatedUntil: string | null;
  intervalWeeks: number;
  meetMinutesBefore: number | null;
  startTime: string;
  startsOn: string;
  timeZone: string;
  weekday: number;
}

export interface Occurrence {
  endsAt: Date;
  meetAt: Date | null;
  /** The planned start. Stored on the event so it is never generated twice. */
  occurrenceStartsAt: Date;
  startsAt: Date;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

const formatterFor = (timeZone: string) => {
  const existing = formatters.get(timeZone);
  if (existing !== undefined) {
    return existing;
  }
  const created = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    hourCycle: "h23",
    minute: "numeric",
    month: "numeric",
    second: "numeric",
    timeZone,
    year: "numeric",
  });
  formatters.set(timeZone, created);
  return created;
};

/** Offset of the zone from UTC at an instant, in milliseconds. */
const offsetAt = (instant: number, timeZone: string) => {
  const flooredToSecond = Math.floor(instant / 1000) * 1000;
  const parts: Record<string, number> = {};
  for (const part of formatterFor(timeZone).formatToParts(flooredToSecond)) {
    if (part.type !== "literal") {
      parts[part.type] = Number(part.value);
    }
  }
  const asUtc = Date.UTC(
    parts.year ?? 0,
    (parts.month ?? 1) - 1,
    parts.day ?? 1,
    parts.hour ?? 0,
    parts.minute ?? 0,
    parts.second ?? 0
  );
  return asUtc - flooredToSecond;
};

const zonedToUtc = (localAsUtc: number, timeZone: string) => {
  const firstOffset = offsetAt(localAsUtc, timeZone);
  const first = localAsUtc - firstOffset;
  const secondOffset = offsetAt(first, timeZone);
  return firstOffset === secondOffset ? first : localAsUtc - secondOffset;
};

const parseDate = (value: string) => {
  const [year = 0, month = 1, day = 1] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};

const parseTime = (value: string) => {
  const [hours = 0, minutes = 0, seconds = 0] = value.split(":").map(Number);
  return ((hours * 60 + minutes) * 60 + seconds) * 1000;
};

const isoWeekday = (dayStart: number) => {
  const day = new Date(dayStart).getUTCDay();
  return day === 0 ? ISO_SUNDAY : day;
};

export const formatDate = (dayStart: number) =>
  new Date(dayStart).toISOString().slice(0, 10);

/**
 * Occurrences of the series on days after `generatedUntil` (or from `startsOn`
 * if nothing has been generated) up to and including `until` and the series'
 * own `endsOn`. Dates are `YYYY-MM-DD`.
 */
export const occurrencesBetween = (
  rule: SeriesRule,
  until: string
): Occurrence[] => {
  const seriesStart = parseDate(rule.startsOn);
  const firstDay =
    seriesStart +
    ((rule.weekday - isoWeekday(seriesStart) + DAYS_PER_WEEK) % DAYS_PER_WEEK) *
      MS_PER_DAY;
  const stepMs = rule.intervalWeeks * DAYS_PER_WEEK * MS_PER_DAY;
  const lastDay = Math.min(
    parseDate(until),
    rule.endsOn === null ? Number.POSITIVE_INFINITY : parseDate(rule.endsOn)
  );
  const afterDay =
    rule.generatedUntil === null ? null : parseDate(rule.generatedUntil);
  const startIndex =
    afterDay === null
      ? 0
      : Math.max(0, Math.floor((afterDay - firstDay) / stepMs) + 1);
  const timeOfDay = parseTime(rule.startTime);
  const occurrences: Occurrence[] = [];

  for (let index = startIndex; ; index += 1) {
    const day = firstDay + index * stepMs;
    if (day > lastDay) {
      break;
    }
    if (afterDay !== null && day <= afterDay) {
      continue;
    }
    if (occurrences.length >= MAX_OCCURRENCES) {
      throw new Error(
        `Refusing to generate more than ${MAX_OCCURRENCES} events at once`
      );
    }
    const startsAt = new Date(zonedToUtc(day + timeOfDay, rule.timeZone));
    occurrences.push({
      endsAt: new Date(
        startsAt.getTime() + rule.durationMinutes * MS_PER_MINUTE
      ),
      meetAt:
        rule.meetMinutesBefore === null
          ? null
          : new Date(
              startsAt.getTime() - rule.meetMinutesBefore * MS_PER_MINUTE
            ),
      occurrenceStartsAt: startsAt,
      startsAt,
    });
  }

  return occurrences;
};
