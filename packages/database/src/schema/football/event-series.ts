/**
 * A repeating event, such as "U12 training every Tuesday at 18:00". The series
 * holds the rule; the real calendar entries are rows in `events` that point
 * back here with `seriesId`. Generating those rows is done by the app, which
 * should create occurrences up to a horizon and record it in `generatedUntil`
 * so the next run carries on from there.
 *
 * The time of day is stored as a local wall-clock time plus an IANA
 * `timeZone` (for example "Europe/London"), not as a UTC instant, so training
 * stays at 18:00 across daylight saving changes. Each occurrence's UTC start is
 * worked out when it is generated.
 *
 * Editing one session (moved venue, cancelled) changes just that `events` row.
 * Its `seriesOccurrenceStartsAt` keeps the originally planned time, so the
 * generator never recreates an occurrence that already exists. A series with
 * events cannot be deleted; end it with `endsOn` or `isActive` instead.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations, users } from "../authentication";
import { venues } from "../club/venues";
import { isOneOf } from "../shared/constraints";
import { EVENT_KINDS } from "./event-kinds";
import type { EventKind } from "./event-kinds";
import { teams } from "./teams";

export const eventSeries = pgTable(
  "event_series",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Cleared if the user is deleted, so the series survives.
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    description: text("description"),
    // Length of each session.
    durationMinutes: integer("duration_minutes").notNull(),
    // Last day a session can fall on. Null runs until the series is ended.
    endsOn: date("ends_on", { mode: "string" }),
    // Up to which day events have been created. Null before the first run.
    generatedUntil: date("generated_until", { mode: "string" }),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    // Every N weeks: 1 is weekly, 2 is fortnightly.
    intervalWeeks: integer("interval_weeks").default(1).notNull(),
    // Stop generating new events without losing the history.
    isActive: boolean("is_active").default(true).notNull(),
    kind: text("kind").$type<EventKind>().notNull(),
    // Players arrive this many minutes before the start. Null for no meet time.
    meetMinutesBefore: integer("meet_minutes_before"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // Local start time, such as 18:00:00, in `timeZone`.
    startTime: time("start_time").notNull(),
    // First day a session can fall on.
    startsOn: date("starts_on", { mode: "string" }).notNull(),
    // Null for club-wide series. Restrict: a team with series cannot be deleted.
    teamId: uuid("team_id"),
    // IANA name, such as "Europe/London".
    timeZone: text("time_zone").notNull(),
    title: text("title").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    // Cleared if the venue is deleted.
    venueId: uuid("venue_id").references(() => venues.id, {
      onDelete: "set null",
    }),
    // ISO weekday: 1 is Monday, 7 is Sunday.
    weekday: integer("weekday").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.teamId],
      foreignColumns: [teams.organizationId, teams.id],
      name: "event_series_team_same_org_fkey",
    }).onDelete("restrict"),
    // Lets `events` reference (organization_id, id) so both must match.
    unique("event_series_organization_id_id_uniq").on(
      table.organizationId,
      table.id
    ),
    check("eventSeries_kind_chk", isOneOf(table.kind, EVENT_KINDS)),
    check("eventSeries_weekday_chk", sql`${table.weekday} between 1 and 7`),
    check(
      "eventSeries_intervalWeeks_chk",
      sql`${table.intervalWeeks} between 1 and 52`
    ),
    check(
      "eventSeries_durationMinutes_chk",
      sql`${table.durationMinutes} between 1 and 1440`
    ),
    check(
      "eventSeries_meetMinutesBefore_chk",
      sql`${table.meetMinutesBefore} is null or ${table.meetMinutesBefore} between 0 and 1440`
    ),
    check(
      "eventSeries_dates_chk",
      sql`${table.endsOn} is null or ${table.endsOn} >= ${table.startsOn}`
    ),
    check("eventSeries_timeZone_chk", sql`length(trim(${table.timeZone})) > 0`),
    index("event_series_organizationId_idx").on(table.organizationId),
    index("event_series_teamId_idx").on(table.teamId),
    index("event_series_venueId_idx").on(table.venueId),
    index("event_series_createdByUserId_idx").on(table.createdByUserId),
  ]
);

/**
 * Only the series' own relations are declared. `events` relates back to its
 * series itself, so this file does not import `events`.
 */
export const eventSeriesRelations = defineRelationsPart(
  { eventSeries, organizations, teams, users, venues },
  (r) => ({
    eventSeries: {
      createdBy: r.one.users({
        from: r.eventSeries.createdByUserId,
        to: r.users.id,
      }),
      organization: r.one.organizations({
        from: r.eventSeries.organizationId,
        to: r.organizations.id,
      }),
      team: r.one.teams({
        from: r.eventSeries.teamId,
        to: r.teams.id,
      }),
      venue: r.one.venues({
        from: r.eventSeries.venueId,
        to: r.venues.id,
      }),
    },
  })
);
