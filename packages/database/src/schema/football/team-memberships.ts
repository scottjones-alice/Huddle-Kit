/**
 * A person's place on a team, with a role and dates. This is where "coach" or
 * "player" lives: the same person can coach one team and play for another, so
 * the role belongs here and not on `people`. Ending a membership sets `endsOn`
 * and keeps the row as history.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  foreignKey,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { people } from "../people/people";
import { isOneOf } from "../shared/constraints";
import { teams } from "./teams";

export const TEAM_MEMBER_ROLES = [
  "player",
  "coach",
  "assistant_coach",
  "manager",
  "volunteer",
] as const;
export type TeamMemberRole = (typeof TEAM_MEMBER_ROLES)[number];

export const teamMemberships = pgTable(
  "team_memberships",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Last day on the team. Null while they are still a member.
    endsOn: date("ends_on", { mode: "string" }),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // Restrict: who was on a team is history, so a person with memberships cannot be deleted.
    personId: uuid("person_id").notNull(),
    role: text("role").$type<TeamMemberRole>().notNull(),
    // Players only.
    shirtNumber: integer("shirt_number"),
    startsOn: date("starts_on", { mode: "string" }).notNull(),
    teamId: uuid("team_id").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.teamId],
      foreignColumns: [teams.organizationId, teams.id],
      name: "team_memberships_team_same_org_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "team_memberships_person_same_org_fkey",
    }).onDelete("restrict"),
    check("teamMemberships_role_chk", isOneOf(table.role, TEAM_MEMBER_ROLES)),
    check(
      "teamMemberships_dates_chk",
      sql`${table.endsOn} is null or ${table.endsOn} >= ${table.startsOn}`
    ),
    check(
      "teamMemberships_shirtNumber_chk",
      sql`${table.shirtNumber} is null or ${table.shirtNumber} between 0 and 999`
    ),
    index("team_memberships_organizationId_idx").on(table.organizationId),
    index("team_memberships_personId_idx").on(table.personId),
    index("team_memberships_teamId_idx").on(table.teamId),
    // The same person cannot be added twice in the same role from the same day.
    uniqueIndex("team_memberships_team_person_role_start_uidx").on(
      table.teamId,
      table.personId,
      table.role,
      table.startsOn
    ),
  ]
);

/**
 * Only the membership's own relations are declared; see the note in `teams.ts`
 * for why `teams` and `people` do not list memberships.
 */
export const teamMembershipRelations = defineRelationsPart(
  { organizations, people, teamMemberships, teams },
  (r) => ({
    teamMemberships: {
      organization: r.one.organizations({
        from: r.teamMemberships.organizationId,
        to: r.organizations.id,
      }),
      person: r.one.people({
        from: r.teamMemberships.personId,
        to: r.people.id,
      }),
      team: r.one.teams({
        from: r.teamMemberships.teamId,
        to: r.teams.id,
      }),
    },
  })
);
