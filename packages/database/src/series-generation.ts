/**
 * Creates the `events` rows for a repeating series up to a date, and records
 * how far it got in `generatedUntil`. Safe to run again: occurrences that
 * already exist (even if moved) are skipped, and the next run carries on from
 * `generatedUntil`.
 */

import { eq } from "drizzle-orm";

import type { Database } from "./create-database";
import { eventSeries } from "./schema/football/event-series";
import { events } from "./schema/football/events";
import { occurrencesBetween } from "./series";

export interface GenerateSeriesResult {
  created: number;
  generatedUntil: string | null;
}

export const generateSeriesEvents = async (
  db: Database,
  seriesId: string,
  until: string
): Promise<GenerateSeriesResult> => {
  const series = await db.query.eventSeries.findFirst({
    where: { id: seriesId },
  });

  if (series === undefined) {
    throw new Error(`Event series ${seriesId} not found`);
  }
  if (!series.isActive) {
    return { created: 0, generatedUntil: series.generatedUntil };
  }

  const occurrences = occurrencesBetween(series, until);
  const reachedUntil =
    series.endsOn !== null && series.endsOn < until ? series.endsOn : until;
  const generatedUntil =
    series.generatedUntil !== null && series.generatedUntil > reachedUntil
      ? series.generatedUntil
      : reachedUntil;

  return await db.transaction(async (tx) => {
    let created = 0;

    if (occurrences.length > 0) {
      const inserted = await tx
        .insert(events)
        .values(
          occurrences.map((occurrence) => ({
            createdByUserId: series.createdByUserId,
            description: series.description,
            endsAt: occurrence.endsAt,
            kind: series.kind,
            meetAt: occurrence.meetAt,
            organizationId: series.organizationId,
            seriesId: series.id,
            seriesOccurrenceStartsAt: occurrence.occurrenceStartsAt,
            startsAt: occurrence.startsAt,
            teamId: series.teamId,
            title: series.title,
            venueId: series.venueId,
          }))
        )
        .onConflictDoNothing({
          target: [events.seriesId, events.seriesOccurrenceStartsAt],
        })
        .returning({ id: events.id });
      created = inserted.length;
    }

    await tx
      .update(eventSeries)
      .set({ generatedUntil })
      .where(eq(eventSeries.id, series.id));

    return { created, generatedUntil };
  });
};
