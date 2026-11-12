/**
 * A person's answer to "can you make it?" for an event: one row per event and
 * person, updated if they change their mind. This is the intention; what really
 * happened is in `event_attendance`. Deleting the event or the person deletes
 * the row, so a data-erasure request needs no special handling here.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { people } from "../people/people";
import { isOneOf } from "../shared/constraints";
import { events } from "./events";

export const AVAILABILITY_STATUSES = [
  "available",
  "unavailable",
  "maybe",
] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const eventAvailability = pgTable(
  "event_availability",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    eventId: uuid("event_id").notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    // Short reason, such as "away on holiday". Keep it free of health detail.
    note: text("note"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    personId: uuid("person_id").notNull(),
    respondedAt: timestamp("responded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    status: text("status").$type<AvailabilityStatus>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.eventId],
      foreignColumns: [events.organizationId, events.id],
      name: "event_availability_event_same_org_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "event_availability_person_same_org_fkey",
    }).onDelete("cascade"),
    check(
      "eventAvailability_status_chk",
      isOneOf(table.status, AVAILABILITY_STATUSES)
    ),
    index("event_availability_organizationId_idx").on(table.organizationId),
    index("event_availability_personId_idx").on(table.personId),
    uniqueIndex("event_availability_event_person_uidx").on(
      table.eventId,
      table.personId
    ),
  ]
);

export const eventAvailabilityRelations = defineRelationsPart(
  { eventAvailability, events, organizations, people },
  (r) => ({
    eventAvailability: {
      event: r.one.events({
        from: r.eventAvailability.eventId,
        to: r.events.id,
      }),
      organization: r.one.organizations({
        from: r.eventAvailability.organizationId,
        to: r.organizations.id,
      }),
      person: r.one.people({
        from: r.eventAvailability.personId,
        to: r.people.id,
      }),
    },
  })
);
