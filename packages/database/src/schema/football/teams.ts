/**
 * A team in the club (the organization) for one season, like "U12 Boys" in 2026/27. A new season
 * means new team rows, so last year's squads stay as history. Who is on the
 * team lives in `team_memberships`.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  foreignKey,
  unique,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { venues } from "../club/venues";
import { seasons } from "./seasons";

export const teams = pgTable(
  "teams",
  {
    // Under-N age band: 12 means U12. Null for open-age and adult teams.
    ageGroup: integer("age_group"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    // Retired teams stay for history but are hidden from pickers.
    isActive: boolean("is_active").default(true).notNull(),
    name: text("name").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // Restrict: a season with teams cannot be deleted.
    seasonId: uuid("season_id").notNull(),
    // Where the team normally trains. Cleared if that venue is deleted.
    trainingVenueId: uuid("training_venue_id").references(() => venues.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.seasonId],
      foreignColumns: [seasons.organizationId, seasons.id],
      name: "teams_season_same_org_fkey",
    }).onDelete("restrict"),
    // Lets other tables reference (organization_id, id) so both must match.
    unique("teams_organization_id_id_uniq").on(table.organizationId, table.id),
    check(
      "teams_ageGroup_chk",
      sql`${table.ageGroup} is null or ${table.ageGroup} between 4 and 99`
    ),
    index("teams_organizationId_idx").on(table.organizationId),
    index("teams_seasonId_idx").on(table.seasonId),
    index("teams_trainingVenueId_idx").on(table.trainingVenueId),
    // A club cannot have two teams with the same name in one season.
    uniqueIndex("teams_organizationId_seasonId_name_uidx").on(
      table.organizationId,
      table.seasonId,
      table.name
    ),
  ]
);

/**
 * Only the team's own relations are declared. Parts merge per table, so adding
 * `teams` to `seasons` or `venues` here would replace theirs, and
 * `teams` cannot list its members without importing `team_memberships`, which
 * imports this file. Load members from `db.query.teamMemberships` instead.
 */
export const teamRelations = defineRelationsPart(
  { organizations, seasons, teams, venues },
  (r) => ({
    teams: {
      organization: r.one.organizations({
        from: r.teams.organizationId,
        to: r.organizations.id,
      }),
      season: r.one.seasons({
        from: r.teams.seasonId,
        to: r.seasons.id,
      }),
      trainingVenue: r.one.venues({
        from: r.teams.trainingVenueId,
        to: r.venues.id,
      }),
    },
  })
);
