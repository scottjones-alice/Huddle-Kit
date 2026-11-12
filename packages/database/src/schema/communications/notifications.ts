/**
 * Something that happened that a user should hear about: an event moved, a
 * consent is due, a charge is overdue. One row per recipient, so each person
 * has their own read state. Delivery (push, email) is the app's job; this is
 * the in-app inbox and the record of what was sent.
 *
 * `entityType` and `entityId` say what it is about, so the app can link to it.
 * They are set together or not at all, and are not foreign keys because they
 * can point at different tables.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations, users } from "../authentication";
import { isOneOf } from "../shared/constraints";

export const NOTIFICATION_KINDS = [
  "announcement",
  "event_change",
  "event_reminder",
  "consent_request",
  "payment_reminder",
  "other",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const notifications = pgTable(
  "notifications",
  {
    body: text("body"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    entityId: uuid("entity_id"),
    entityType: text("entity_type"),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    kind: text("kind").$type<NotificationKind>().notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }),
    title: text("title").notNull(),
    // The recipient. Deleting the user deletes their inbox.
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    check("notifications_kind_chk", isOneOf(table.kind, NOTIFICATION_KINDS)),
    check("notifications_title_chk", sql`length(trim(${table.title})) > 0`),
    check(
      "notifications_entity_chk",
      sql`(${table.entityType} is null) = (${table.entityId} is null)`
    ),
    index("notifications_organizationId_idx").on(table.organizationId),
    index("notifications_userId_readAt_idx").on(table.userId, table.readAt),
  ]
);

export const notificationRelations = defineRelationsPart(
  { notifications, organizations, users },
  (r) => ({
    notifications: {
      organization: r.one.organizations({
        from: r.notifications.organizationId,
        to: r.organizations.id,
      }),
      user: r.one.users({
        from: r.notifications.userId,
        to: r.users.id,
      }),
    },
  })
);
