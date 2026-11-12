/**
 * The audit trail: one row each time someone reads or changes something that
 * matters (a safeguarding concern, a medical record, a date of birth).
 *
 * Append-only. A database trigger (see the `audit_events_append_only`
 * migration) rejects UPDATE and DELETE, so history cannot be edited from app
 * code or by mistake.
 *
 * Deliberately has NO foreign keys. A key with `cascade` would erase the trail
 * when an organization or user is deleted, and `set null` would need an
 * UPDATE, which the trigger forbids. The ids are kept as plain values instead.
 * Never put the sensitive content itself in `metadata`; record that it was
 * accessed, not what it said.
 */

import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  check,
} from "drizzle-orm/pg-core";

export const auditEvents = pgTable(
  "audit_events",
  {
    // What happened, as "entity.verb": "safeguarding_concern.read", "person.update".
    action: text("action").notNull(),
    // Who did it. Null for system actions. Not a foreign key, see above.
    actorUserId: uuid("actor_user_id"),
    // The record acted on. Null when the action is not about one record.
    entityId: uuid("entity_id"),
    entityType: text("entity_type").notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    ipAddress: text("ip_address"),
    // Small non-sensitive context, like the fields that changed.
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    organizationId: uuid("organization_id").notNull(),
    userAgent: text("user_agent"),
  },
  (table) => [
    check(
      "auditEvents_action_chk",
      sql`${table.action} ~ '^[a-z][a-z_]*[.][a-z][a-z_]*$'`
    ),
    index("audit_events_actorUserId_occurredAt_idx").on(
      table.actorUserId,
      table.occurredAt
    ),
    index("audit_events_organizationId_entity_idx").on(
      table.organizationId,
      table.entityType,
      table.entityId
    ),
    index("audit_events_organizationId_occurredAt_idx").on(
      table.organizationId,
      table.occurredAt
    ),
  ]
);
