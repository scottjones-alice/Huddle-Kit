/**
 * A fee the club charges for a season, such as "Subs 2026/27" or "Kit". The
 * fee is the template; each person actually owing it gets a row in
 * `fee_charges`. A fee can be for one team or, with no team, the whole club.
 *
 * Money is stored as whole minor units (pence or cents) in an integer, with a
 * three-letter ISO 4217 currency code, so there is no rounding. The club never
 * stores card numbers: payments are only records of money received.
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
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { seasons } from "../football/seasons";
import { teams } from "../football/teams";

export const fees = pgTable(
  "fees",
  {
    // Minor units: 2500 is 25.00.
    amountMinor: integer("amount_minor").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // ISO 4217, upper case.
    currency: text("currency").default("GBP").notNull(),
    description: text("description"),
    dueOn: date("due_on", { mode: "string" }),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    isActive: boolean("is_active").default(true).notNull(),
    name: text("name").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id").notNull(),
    // Null charges the whole club.
    teamId: uuid("team_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.seasonId],
      foreignColumns: [seasons.organizationId, seasons.id],
      name: "fees_season_same_org_fkey",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.organizationId, table.teamId],
      foreignColumns: [teams.organizationId, teams.id],
      name: "fees_team_same_org_fkey",
    }).onDelete("restrict"),
    unique("fees_organization_id_id_uniq").on(table.organizationId, table.id),
    check("fees_amountMinor_chk", sql`${table.amountMinor} >= 0`),
    check("fees_currency_chk", sql`${table.currency} ~ '^[A-Z]{3}$'`),
    check("fees_name_chk", sql`length(trim(${table.name})) > 0`),
    index("fees_organizationId_idx").on(table.organizationId),
    index("fees_seasonId_idx").on(table.seasonId),
    index("fees_teamId_idx").on(table.teamId),
  ]
);

export const feeRelations = defineRelationsPart(
  { fees, organizations, seasons, teams },
  (r) => ({
    fees: {
      organization: r.one.organizations({
        from: r.fees.organizationId,
        to: r.organizations.id,
      }),
      season: r.one.seasons({
        from: r.fees.seasonId,
        to: r.seasons.id,
      }),
      team: r.one.teams({
        from: r.fees.teamId,
        to: r.teams.id,
      }),
    },
  })
);
