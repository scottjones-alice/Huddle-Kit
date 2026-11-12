/**
 * Who actually turned up to an event, recorded by a coach afterwards. One row
 * per event and person. Separate from `event_availability`, which is what
 * people said beforehand.
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

import { organizations, users } from "../authentication";
import { people } from "../people/people";
import { isOneOf } from "../shared/constraints";
import { events } from "./events";

export const ATTENDANCE_STATUSES = [
  "present",
  "late",
  "absent",
  "excused",
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const eventAttendance = pgTable(
  "event_attendance",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    eventId: uuid("event_id").notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    note: text("note"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    personId: uuid("person_id").notNull(),
    // Who took the register. Cleared if that user is deleted.
    recordedByUserId: uuid("recorded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: text("status").$type<AttendanceStatus>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.eventId],
      foreignColumns: [events.organizationId, events.id],
      name: "event_attendance_event_same_org_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "event_attendance_person_same_org_fkey",
    }).onDelete("cascade"),
    check(
      "eventAttendance_status_chk",
      isOneOf(table.status, ATTENDANCE_STATUSES)
    ),
    index("event_attendance_organizationId_idx").on(table.organizationId),
    index("event_attendance_personId_idx").on(table.personId),
    index("event_attendance_recordedByUserId_idx").on(table.recordedByUserId),
    uniqueIndex("event_attendance_event_person_uidx").on(
      table.eventId,
      table.personId
    ),
  ]
);

export const eventAttendanceRelations = defineRelationsPart(
  { eventAttendance, events, organizations, people, users },
  (r) => ({
    eventAttendance: {
      event: r.one.events({
        from: r.eventAttendance.eventId,
        to: r.events.id,
      }),
      organization: r.one.organizations({
        from: r.eventAttendance.organizationId,
        to: r.organizations.id,
      }),
      person: r.one.people({
        from: r.eventAttendance.personId,
        to: r.people.id,
      }),
      recordedBy: r.one.users({
        from: r.eventAttendance.recordedByUserId,
        to: r.users.id,
      }),
    },
  })
);
