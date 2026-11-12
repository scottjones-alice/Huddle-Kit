/**
 * The running log on a safeguarding concern: each call, decision and referral,
 * one row each. Append-only. A database trigger (see the
 * `safeguarding_notes_append_only` migration) rejects UPDATE, DELETE and
 * TRUNCATE, so the record of what was done cannot be rewritten. To correct a
 * mistake, add a new note.
 *
 * `authorUserId` is a plain value, not a foreign key: `set null` would need an
 * UPDATE, which the trigger forbids. The concern and organization are
 * `restrict`, so a concern with notes cannot be deleted.
 *
 * `body` can contain sensitive detail: encrypt it in the application, and write
 * an `audit_events` row on every read.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  foreignKey,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { safeguardingConcerns } from "./concerns";

export const safeguardingNotes = pgTable(
  "safeguarding_notes",
  {
    // Who wrote it. Not a foreign key, see above.
    authorUserId: uuid("author_user_id"),
    body: text("body").notNull(),
    concernId: uuid("concern_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.concernId],
      foreignColumns: [
        safeguardingConcerns.organizationId,
        safeguardingConcerns.id,
      ],
      name: "safeguarding_notes_concern_same_org_fkey",
    }).onDelete("restrict"),
    index("safeguarding_notes_concernId_createdAt_idx").on(
      table.concernId,
      table.createdAt
    ),
    index("safeguarding_notes_organizationId_idx").on(table.organizationId),
  ]
);

export const safeguardingNoteRelations = defineRelationsPart(
  { organizations, safeguardingConcerns, safeguardingNotes },
  (r) => ({
    safeguardingNotes: {
      concern: r.one.safeguardingConcerns({
        from: r.safeguardingNotes.concernId,
        to: r.safeguardingConcerns.id,
      }),
      organization: r.one.organizations({
        from: r.safeguardingNotes.organizationId,
        to: r.organizations.id,
      }),
    },
  })
);
