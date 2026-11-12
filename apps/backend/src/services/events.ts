import {
  eventAttendance,
  eventAvailability,
  eventSeries,
  events,
  generateSeriesEvents,
  matchDetails,
  matchSquad,
} from "@alice/database";
import type {
  AttendanceStatus,
  AvailabilityStatus,
  Database,
  EventKind,
  EventStatus,
  HomeAway,
  SquadRole,
} from "@alice/database";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { forbidden, invalid, notFound } from "@/lib/app-error";
import { guardWrite } from "@/lib/guard-write";
import { canCoachTeam } from "@/services/access";
import type { Caller } from "@/services/access";
import { editablePersonIds } from "@/services/people";

const WEEKS_AHEAD = 12;
const MS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;

/** Events without a team (club socials, meetings) are for club admins. Team events are for that team's coaches. */
export const assertCanRun = (caller: Caller, teamId: string | null): void => {
  const allowed =
    teamId === null ? caller.isManager : canCoachTeam(caller, teamId);
  if (!allowed) {
    throw forbidden(
      teamId === null
        ? "Only a club admin can run club-wide events"
        : "You do not coach this team"
    );
  }
};

export interface MatchInput {
  competition?: string | null;
  goalsAgainst?: number | null;
  goalsFor?: number | null;
  homeAway: HomeAway;
  opponentId: string;
}

export interface EventFilters {
  from?: Date | undefined;
  kind?: EventKind | undefined;
  limit: number;
  offset: number;
  status?: EventStatus | undefined;
  teamId?: string | undefined;
  to?: Date | undefined;
}

export const listEvents = async (
  db: Database,
  organizationId: string,
  filters: EventFilters
) => {
  const conditions: (SQL | undefined)[] = [
    eq(events.organizationId, organizationId),
    filters.from === undefined ? undefined : gte(events.startsAt, filters.from),
    filters.to === undefined ? undefined : lt(events.startsAt, filters.to),
    filters.teamId === undefined
      ? undefined
      : eq(events.teamId, filters.teamId),
    filters.kind === undefined ? undefined : eq(events.kind, filters.kind),
    filters.status === undefined
      ? undefined
      : eq(events.status, filters.status),
  ];
  return await db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(asc(events.startsAt))
    .limit(filters.limit)
    .offset(filters.offset);
};

const matchFor = async (db: Database, eventId: string) => {
  const [row] = await db
    .select()
    .from(matchDetails)
    .where(eq(matchDetails.eventId, eventId));
  return row ?? null;
};

export const getEvent = async (
  db: Database,
  organizationId: string,
  id: string
) => {
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.organizationId, organizationId), eq(events.id, id)));
  if (event === undefined) {
    throw notFound("Event");
  }
  return { ...event, match: await matchFor(db, id) };
};

export interface EventInput {
  description?: string | null;
  endsAt: Date;
  kind: EventKind;
  match?: MatchInput | undefined;
  meetAt?: Date | null;
  startsAt: Date;
  teamId?: string | null;
  title: string;
  venueId?: string | null;
}

export const createEvent = async (
  db: Database,
  caller: Caller,
  input: EventInput
) => {
  assertCanRun(caller, input.teamId ?? null);
  const { match, ...values } = input;
  const id = await guardWrite(
    async () =>
      await db.transaction(async (tx) => {
        const [event] = await tx
          .insert(events)
          .values({
            ...values,
            createdByUserId: caller.userId,
            organizationId: caller.organizationId,
          })
          .returning({ id: events.id });
        if (event === undefined) {
          throw new Error("Event insert returned no row");
        }
        if (match !== undefined) {
          await tx.insert(matchDetails).values({
            ...match,
            eventId: event.id,
            organizationId: caller.organizationId,
          });
        }
        return event.id;
      }),
    {
      invalid:
        "The event must end after it starts, and the meeting time must be before the start",
      missing: "Team, venue or opponent",
    }
  );
  return await getEvent(db, caller.organizationId, id);
};

export interface EventChanges extends Partial<Omit<EventInput, "match">> {
  cancellationReason?: string | null;
  match?: Partial<MatchInput> | undefined;
  status?: EventStatus;
}

export const updateEvent = async (
  db: Database,
  caller: Caller,
  id: string,
  changes: EventChanges
) => {
  const current = await getEvent(db, caller.organizationId, id);
  assertCanRun(caller, current.teamId);
  if (changes.teamId !== undefined) {
    assertCanRun(caller, changes.teamId);
  }
  const reason = changes.cancellationReason ?? current.cancellationReason;
  if (changes.status === "cancelled" && (reason ?? "").length === 0) {
    throw invalid("A cancelled event needs a reason");
  }
  const { match, ...values } = changes;
  await guardWrite(
    async () => {
      await db.transaction(async (tx) => {
        if (Object.keys(values).length > 0) {
          await tx
            .update(events)
            .set(values)
            .where(
              and(
                eq(events.organizationId, caller.organizationId),
                eq(events.id, id)
              )
            );
        }
        if (match !== undefined && Object.keys(match).length > 0) {
          const result = await tx
            .update(matchDetails)
            .set(match)
            .where(eq(matchDetails.eventId, id))
            .returning({ id: matchDetails.eventId });
          if (
            result.length === 0 &&
            match.opponentId !== undefined &&
            match.homeAway !== undefined
          ) {
            await tx.insert(matchDetails).values({
              ...match,
              eventId: id,
              homeAway: match.homeAway,
              opponentId: match.opponentId,
              organizationId: caller.organizationId,
            });
          }
        }
      });
    },
    {
      invalid:
        "The event must end after it starts, and a cancelled event needs a reason",
      missing: "Team, venue or opponent",
    }
  );
  return await getEvent(db, caller.organizationId, id);
};

export interface AvailabilityInput {
  note?: string | null;
  personId?: string | undefined;
  status: AvailabilityStatus;
}

/**
 * "Can they make it?" Anyone answers for themselves and their own children;
 * club admins can answer for anyone.
 */
export const setAvailability = async (
  db: Database,
  caller: Caller,
  eventId: string,
  input: AvailabilityInput
) => {
  await getEvent(db, caller.organizationId, eventId);
  const editable = await editablePersonIds(db, caller);
  const personId =
    input.personId ?? (editable === null ? undefined : editable[0]);
  if (personId === undefined) {
    throw notFound("Person");
  }
  if (editable !== null && !editable.includes(personId)) {
    throw forbidden("You can only answer for yourself and your children");
  }
  const values = { note: input.note ?? null, status: input.status };
  const [row] = await guardWrite(
    async () =>
      await db
        .insert(eventAvailability)
        .values({
          ...values,
          eventId,
          organizationId: caller.organizationId,
          personId,
        })
        .onConflictDoUpdate({
          set: { ...values, respondedAt: new Date() },
          target: [eventAvailability.eventId, eventAvailability.personId],
        })
        .returning(),
    { missing: "Person" }
  );
  if (row === undefined) {
    throw new Error("Availability upsert returned no row");
  }
  return row;
};

/** Coaches of the event's team see every answer. Everyone else sees only their own and their children's. */
export const listAvailability = async (
  db: Database,
  caller: Caller,
  eventId: string
) => {
  const [event, rows, editable] = await Promise.all([
    getEvent(db, caller.organizationId, eventId),
    db
      .select()
      .from(eventAvailability)
      .where(eq(eventAvailability.eventId, eventId)),
    editablePersonIds(db, caller),
  ]);
  const sees =
    event.teamId === null
      ? caller.isManager
      : canCoachTeam(caller, event.teamId);
  if (sees || editable === null) {
    return rows;
  }
  const mine = new Set(editable);
  return rows.filter((row) => mine.has(row.personId));
};

export interface AttendanceInput {
  note?: string | null;
  personId: string;
  status: AttendanceStatus;
}

export const listAttendance = async (
  db: Database,
  caller: Caller,
  eventId: string
) => {
  const event = await getEvent(db, caller.organizationId, eventId);
  assertCanRun(caller, event.teamId);
  return await db
    .select()
    .from(eventAttendance)
    .where(eq(eventAttendance.eventId, eventId));
};

/** Records who turned up. Only the team's coaches (or admins) can, and a second save changes the first. */
export const recordAttendance = async (
  db: Database,
  caller: Caller,
  eventId: string,
  records: AttendanceInput[]
) => {
  const event = await getEvent(db, caller.organizationId, eventId);
  assertCanRun(caller, event.teamId);
  await guardWrite(
    async () => {
      await db.transaction(async (tx) => {
        await Promise.all(
          records.map(
            async (record) =>
              await tx
                .insert(eventAttendance)
                .values({
                  eventId,
                  note: record.note ?? null,
                  organizationId: caller.organizationId,
                  personId: record.personId,
                  recordedByUserId: caller.userId,
                  status: record.status,
                })
                .onConflictDoUpdate({
                  set: {
                    note: record.note ?? null,
                    recordedByUserId: caller.userId,
                    status: record.status,
                  },
                  target: [eventAttendance.eventId, eventAttendance.personId],
                })
          )
        );
      });
    },
    { missing: "Person" }
  );
  return await listAttendance(db, caller, eventId);
};

export interface SquadMember {
  goals?: number;
  minutesPlayed?: number | null;
  personId: string;
  position?: string | null;
  role: SquadRole;
  shirtNumber?: number | null;
}

export const getSquad = async (
  db: Database,
  organizationId: string,
  eventId: string
) => {
  await getEvent(db, organizationId, eventId);
  return await db
    .select()
    .from(matchSquad)
    .where(eq(matchSquad.eventId, eventId));
};

/** Picks the squad for a match. Sending the list again replaces the earlier pick. */
export const setSquad = async (
  db: Database,
  caller: Caller,
  eventId: string,
  squad: SquadMember[]
) => {
  const event = await getEvent(db, caller.organizationId, eventId);
  assertCanRun(caller, event.teamId);
  await guardWrite(
    async () => {
      await db.transaction(async (tx) => {
        await tx.delete(matchSquad).where(eq(matchSquad.eventId, eventId));
        if (squad.length > 0) {
          await tx.insert(matchSquad).values(
            squad.map((member) => ({
              ...member,
              eventId,
              organizationId: caller.organizationId,
            }))
          );
        }
      });
    },
    {
      invalid: "A squad number, goals or minutes are out of range",
      missing: "Person",
      taken: "A person is listed twice in the squad",
    }
  );
  return await getSquad(db, caller.organizationId, eventId);
};

export interface SeriesInput {
  description?: string | null;
  durationMinutes: number;
  endsOn?: string | null;
  intervalWeeks?: number;
  kind: EventKind;
  meetMinutesBefore?: number | null;
  startTime: string;
  startsOn: string;
  teamId?: string | null;
  timeZone: string;
  title: string;
  venueId?: string | null;
  weekday: number;
}

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

const defaultUntil = (): string =>
  isoDate(new Date(Date.now() + WEEKS_AHEAD * DAYS_PER_WEEK * MS_PER_DAY));

export const createSeries = async (
  db: Database,
  caller: Caller,
  input: SeriesInput,
  until?: string
) => {
  assertCanRun(caller, input.teamId ?? null);
  const series = await guardWrite(
    async () => {
      const [row] = await db
        .insert(eventSeries)
        .values({
          ...input,
          createdByUserId: caller.userId,
          organizationId: caller.organizationId,
        })
        .returning();
      if (row === undefined) {
        throw new Error("Series insert returned no row");
      }
      return row;
    },
    {
      invalid: "Check the weekday, time zone, interval and dates",
      missing: "Team or venue",
    }
  );
  const result = await generateSeriesEvents(
    db,
    series.id,
    until ?? defaultUntil()
  );
  return { created: result.created, series };
};

export const listSeries = async (db: Database, organizationId: string) =>
  await db
    .select()
    .from(eventSeries)
    .where(eq(eventSeries.organizationId, organizationId))
    .orderBy(asc(eventSeries.title));

const getSeriesRow = async (
  db: Database,
  organizationId: string,
  id: string
) => {
  const [row] = await db
    .select()
    .from(eventSeries)
    .where(
      and(
        eq(eventSeries.organizationId, organizationId),
        eq(eventSeries.id, id)
      )
    );
  if (row === undefined) {
    throw notFound("Series");
  }
  return row;
};

/** Stops a series (isActive false). Events already made are kept; nothing new is generated. */
export const updateSeries = async (
  db: Database,
  caller: Caller,
  id: string,
  changes: { endsOn?: string | null; isActive?: boolean }
) => {
  const current = await getSeriesRow(db, caller.organizationId, id);
  assertCanRun(caller, current.teamId);
  const [row] = await guardWrite(
    async () =>
      await db
        .update(eventSeries)
        .set(changes)
        .where(eq(eventSeries.id, id))
        .returning(),
    { invalid: "A series cannot end before it starts" }
  );
  if (row === undefined) {
    throw notFound("Series");
  }
  return row;
};

/** Makes the next events for a series, up to a date. Safe to repeat: existing events are skipped. */
export const extendSeries = async (
  db: Database,
  caller: Caller,
  id: string,
  until: string
) => {
  const current = await getSeriesRow(db, caller.organizationId, id);
  assertCanRun(caller, current.teamId);
  return await generateSeriesEvents(db, id, until);
};
