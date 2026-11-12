import { describe, expect, it } from "vitest";

import { occurrencesBetween } from "../src/series";
import type { SeriesRule } from "../src/series";

const rule: SeriesRule = {
  durationMinutes: 90,
  endsOn: null,
  generatedUntil: null,
  intervalWeeks: 1,
  meetMinutesBefore: null,
  startTime: "18:00",
  startsOn: "2026-09-01",
  timeZone: "Europe/London",
  weekday: 2,
};

const iso = (dates: Date[]) => dates.map((date) => date.toISOString());

describe(occurrencesBetween, () => {
  it("lists every matching weekday from the start date", () => {
    const result = occurrencesBetween(rule, "2026-09-22");

    expect(iso(result.map((o) => o.startsAt))).toStrictEqual([
      "2026-09-01T17:00:00.000Z",
      "2026-09-08T17:00:00.000Z",
      "2026-09-15T17:00:00.000Z",
      "2026-09-22T17:00:00.000Z",
    ]);
  });

  it("starts on the first matching weekday after startsOn", () => {
    const result = occurrencesBetween({ ...rule, weekday: 4 }, "2026-09-10");

    expect(iso(result.map((o) => o.startsAt))).toStrictEqual([
      "2026-09-03T17:00:00.000Z",
      "2026-09-10T17:00:00.000Z",
    ]);
  });

  it("keeps the local time across the end of daylight saving", () => {
    const result = occurrencesBetween(
      { ...rule, startsOn: "2026-10-20" },
      "2026-11-03"
    );

    expect(iso(result.map((o) => o.startsAt))).toStrictEqual([
      "2026-10-20T17:00:00.000Z",
      "2026-10-27T18:00:00.000Z",
      "2026-11-03T18:00:00.000Z",
    ]);
  });

  it("handles a local time that does not exist", () => {
    const result = occurrencesBetween(
      { ...rule, startTime: "01:30", startsOn: "2026-03-29", weekday: 7 },
      "2026-03-29"
    );

    expect(iso(result.map((o) => o.startsAt))).toStrictEqual([
      "2026-03-29T01:30:00.000Z",
    ]);
  });

  it("supports fortnightly series, an end date and a meet time", () => {
    const result = occurrencesBetween(
      {
        ...rule,
        endsOn: "2026-09-20",
        intervalWeeks: 2,
        meetMinutesBefore: 30,
      },
      "2026-12-31"
    );

    expect(result).toHaveLength(2);
    expect(result[1]?.startsAt.toISOString()).toBe("2026-09-15T17:00:00.000Z");
    expect(result[1]?.endsAt.toISOString()).toBe("2026-09-15T18:30:00.000Z");
    expect(result[1]?.meetAt?.toISOString()).toBe("2026-09-15T16:30:00.000Z");
  });

  it("carries on after generatedUntil without repeating days", () => {
    const first = occurrencesBetween(rule, "2026-09-15");
    const next = occurrencesBetween(
      { ...rule, generatedUntil: "2026-09-15" },
      "2026-09-29"
    );

    expect(first).toHaveLength(3);
    expect(iso(next.map((o) => o.startsAt))).toStrictEqual([
      "2026-09-22T17:00:00.000Z",
      "2026-09-29T17:00:00.000Z",
    ]);
  });

  it("returns nothing when the end is before the first session", () => {
    expect(occurrencesBetween(rule, "2026-08-01")).toStrictEqual([]);
  });
});
