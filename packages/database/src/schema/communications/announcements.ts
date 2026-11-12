/**
 * A one-way notice from the club to its members: "training is moved to the
 * clubhouse", "AGM next week". Club-wide when `teamId` is null, otherwise for
 * one team. A draft has no `publishedAt`.
 *
 * There is deliberately no private messaging table. One-to-one messages
 * between adults and children are a safeguarding risk, so the club talks to
 * parents through announcements and notifications, which are visible to the
 * club and auditable.
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
  uuid,
} from "drizzle-orm/pg-core";

import { organizations, users } from "../authentication";
import { teams } from "../football/teams";

export const announcements = pgTable(
  "announcements",
  {
    // Cleared if the author's login is deleted.
    authorUserId: uuid("author_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Stop showing it after this time. Null shows it until removed.
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // Null while it is a draft.
    publishedAt: timestamp("published_at", { withTimezone: true }),
    teamId: uuid("team_id"),
    title: text("title").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.teamId],
      foreignColumns: [teams.organizationId, teams.id],
      name: "announcements_team_same_org_fkey",
    }).onDelete("cascade"),
    unique("announcements_organization_id_id_uniq").on(
      table.organizationId,
      table.id
    ),
    check("announcements_title_chk", sql`length(trim(${table.title})) > 0`),
    check("announcements_body_chk", sql`length(trim(${table.body})) > 0`),
    check(
      "announcements_expires_chk",
      sql`${table.expiresAt} is null or ${table.publishedAt} is null or ${table.expiresAt} > ${table.publishedAt}`
    ),
    index("announcements_authorUserId_idx").on(table.authorUserId),
    index("announcements_organizationId_publishedAt_idx").on(
      table.organizationId,
      table.publishedAt
    ),
    index("announcements_teamId_idx").on(table.teamId),
  ]
);

export const announcementRelations = defineRelationsPart(
  { announcements, organizations, teams, users },
  (r) => ({
    announcements: {
      author: r.one.users({
        from: r.announcements.authorUserId,
        to: r.users.id,
      }),
      organization: r.one.organizations({
        from: r.announcements.organizationId,
        to: r.organizations.id,
      }),
      team: r.one.teams({
        from: r.announcements.teamId,
        to: r.teams.id,
      }),
    },
  })
);
