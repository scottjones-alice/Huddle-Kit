/**
 * A playing season, like "2026/27". Teams belong to a season, so a new season
 * means new squads while last year's stay as history.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  unique,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";

export const seasons = pgTable(
  "seasons",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Calendar dates with no time or timezone, kept as "YYYY-MM-DD".
    endsOn: date("ends_on", { mode: "string" }).notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    // At most one season per organization is current (see the partial index below).
    isCurrent: boolean("is_current").default(false).notNull(),
    name: text("name").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    startsOn: date("starts_on", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // Lets other tables reference (organization_id, id) so both must match.
    unique("seasons_organization_id_id_uniq").on(
      table.organizationId,
      table.id
    ),
    check("seasons_dates_chk", sql`${table.endsOn} > ${table.startsOn}`),
    index("seasons_organizationId_idx").on(table.organizationId),
    uniqueIndex("seasons_organizationId_name_uidx").on(
      table.organizationId,
      table.name
    ),
    // Only one current season per organization.
    uniqueIndex("seasons_organizationId_current_uidx")
      .on(table.organizationId)
      .where(sql`${table.isCurrent}`),
  ]
);

/**
 * Only the season's own relations are declared. Parts merge per table, so
 * adding `seasons` to `organizations` here would replace its relations.
 */
export const seasonRelations = defineRelationsPart(
  { organizations, seasons },
  (r) => ({
    seasons: {
      organization: r.one.organizations({
        from: r.seasons.organizationId,
        to: r.organizations.id,
      }),
    },
  })
);
