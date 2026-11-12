/**
 * A person's registration with the club for a season: they asked to join, were
 * accepted (or not), and which team they were placed in, if any. This is
 * separate from `team_memberships`, which says who is on a team and in what
 * role. A registration can exist before a team is chosen, and a withdrawn one
 * stays as history.
 *
 * One registration per person per season. A person, season or team with
 * registrations cannot be deleted (restrict).
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  date,
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
import { seasons } from "./seasons";
import { teams } from "./teams";

export const REGISTRATION_STATUSES = [
  "pending",
  "active",
  "withdrawn",
  "rejected",
] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const registrations = pgTable(
  "registrations",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    notes: text("notes"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    personId: uuid("person_id").notNull(),
    registeredOn: date("registered_on", { mode: "string" }).notNull(),
    seasonId: uuid("season_id").notNull(),
    status: text("status")
      .$type<RegistrationStatus>()
      .default("pending")
      .notNull(),
    // The team they were placed in. Null until chosen.
    teamId: uuid("team_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    // Set exactly when the status is "withdrawn".
    withdrawnOn: date("withdrawn_on", { mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "registrations_person_same_org_fkey",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.organizationId, table.seasonId],
      foreignColumns: [seasons.organizationId, seasons.id],
      name: "registrations_season_same_org_fkey",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.organizationId, table.teamId],
      foreignColumns: [teams.organizationId, teams.id],
      name: "registrations_team_same_org_fkey",
    }).onDelete("restrict"),
    check(
      "registrations_status_chk",
      isOneOf(table.status, REGISTRATION_STATUSES)
    ),
    check(
      "registrations_withdrawn_chk",
      sql`(${table.status} = 'withdrawn') = (${table.withdrawnOn} is not null)`
    ),
    index("registrations_organizationId_idx").on(table.organizationId),
    index("registrations_seasonId_idx").on(table.seasonId),
    index("registrations_teamId_idx").on(table.teamId),
    uniqueIndex("registrations_person_season_uidx").on(
      table.personId,
      table.seasonId
    ),
  ]
);

export const registrationRelations = defineRelationsPart(
  { organizations, people, registrations, seasons, teams },
  (r) => ({
    registrations: {
      organization: r.one.organizations({
        from: r.registrations.organizationId,
        to: r.organizations.id,
      }),
      person: r.one.people({
        from: r.registrations.personId,
        to: r.people.id,
      }),
      season: r.one.seasons({
        from: r.registrations.seasonId,
        to: r.seasons.id,
      }),
      team: r.one.teams({
        from: r.registrations.teamId,
        to: r.teams.id,
      }),
    },
  })
);
