/**
 * Something that happens on a calendar: a training session, a match, a social
 * or a meeting. One table for all of them keeps the calendar, availability and
 * attendance in one place; the extra facts for a match live in `match_details`.
 *
 * `teamId` is optional because some events (a club social, an AGM) belong to the
 * whole club. The composite foreign key forces a team to be in the same
 * organization. `venueId` is cleared if the venue is deleted, so check in the
 * app that it belongs to the same organization.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations, users } from "../authentication";
import { venues } from "../club/venues";
import { isOneOf } from "../shared/constraints";
import { EVENT_KINDS } from "./event-kinds";
import type { EventKind } from "./event-kinds";
import { eventSeries } from "./event-series";
import { teams } from "./teams";

export const EVENT_STATUSES = [
  "scheduled",
  "cancelled",
  "postponed",
  "completed",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const events = pgTable(
  "events",
  {
    // Why it was cancelled or postponed. Shown to parents.
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Cleared if the user is deleted, so the event itself survives.
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    description: text("description"),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    kind: text("kind").$type<EventKind>().notNull(),
    // When players should arrive, if earlier than the start.
    meetAt: timestamp("meet_at", { withTimezone: true }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // The series this session was generated from. Null for one-off events.
    // Restrict: a series with events cannot be deleted.
    seriesId: uuid("series_id"),
    // When this session was originally planned by the series rule. It stays
    // put if the session is later moved, so it is never generated twice.
    seriesOccurrenceStartsAt: timestamp("series_occurrence_starts_at", {
      withTimezone: true,
    }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    status: text("status").$type<EventStatus>().default("scheduled").notNull(),
    // Null for club-wide events. Restrict: a team with events cannot be deleted.
    teamId: uuid("team_id"),
    title: text("title").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    // Cleared if the venue is deleted.
    venueId: uuid("venue_id").references(() => venues.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.teamId],
      foreignColumns: [teams.organizationId, teams.id],
      name: "events_team_same_org_fkey",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.organizationId, table.seriesId],
      foreignColumns: [eventSeries.organizationId, eventSeries.id],
      name: "events_series_same_org_fkey",
    }).onDelete("restrict"),
    check(
      "events_series_chk",
      sql`(${table.seriesId} is null) = (${table.seriesOccurrenceStartsAt} is null)`
    ),
    uniqueIndex("events_series_occurrence_uidx").on(
      table.seriesId,
      table.seriesOccurrenceStartsAt
    ),
    // Lets child tables reference (organization_id, id) so both must match.
    unique("events_organization_id_id_uniq").on(table.organizationId, table.id),
    check("events_kind_chk", isOneOf(table.kind, EVENT_KINDS)),
    check("events_status_chk", isOneOf(table.status, EVENT_STATUSES)),
    check("events_dates_chk", sql`${table.endsAt} > ${table.startsAt}`),
    check(
      "events_meetAt_chk",
      sql`${table.meetAt} is null or ${table.meetAt} <= ${table.startsAt}`
    ),
    index("events_organizationId_startsAt_idx").on(
      table.organizationId,
      table.startsAt
    ),
    index("events_teamId_startsAt_idx").on(table.teamId, table.startsAt),
    index("events_venueId_idx").on(table.venueId),
  ]
);

/**
 * Only the event's own relations are declared. Child tables (match details,
 * availability, attendance, squad) relate back to the event themselves, so
 * `events` does not import them.
 */
export const eventRelations = defineRelationsPart(
  { eventSeries, events, organizations, teams, users, venues },
  (r) => ({
    events: {
      createdBy: r.one.users({
        from: r.events.createdByUserId,
        to: r.users.id,
      }),
      organization: r.one.organizations({
        from: r.events.organizationId,
        to: r.organizations.id,
      }),
      series: r.one.eventSeries({
        from: r.events.seriesId,
        to: r.eventSeries.id,
      }),
      team: r.one.teams({
        from: r.events.teamId,
        to: r.teams.id,
      }),
      venue: r.one.venues({
        from: r.events.venueId,
        to: r.venues.id,
      }),
    },
  })
);
