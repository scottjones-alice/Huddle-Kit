/**
 * Football details about a player: preferred foot, positions and height. One
 * row per person (the person id is the primary key), created only for people
 * who play. Team and shirt number belong to `team_memberships`, not here,
 * because they change by season.
 *
 * Height is personal data about a child. Keep it out of public views.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { isOneOf } from "../shared/constraints";
import { people } from "./people";

export const PREFERRED_FEET = ["left", "right", "both"] as const;
export type PreferredFoot = (typeof PREFERRED_FEET)[number];

export const playerProfiles = pgTable(
  "player_profiles",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    heightCm: integer("height_cm"),
    notes: text("notes"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    personId: uuid("person_id").notNull(),
    preferredFoot: text("preferred_foot").$type<PreferredFoot>(),
    // Free text, such as "GK" or "Centre back". Formations differ by age group.
    primaryPosition: text("primary_position"),
    secondaryPosition: text("secondary_position"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.personId], name: "player_profiles_pk" }),
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "player_profiles_person_same_org_fkey",
    }).onDelete("cascade"),
    check(
      "playerProfiles_preferredFoot_chk",
      sql`${table.preferredFoot} is null or ${isOneOf(table.preferredFoot, PREFERRED_FEET)}`
    ),
    check(
      "playerProfiles_heightCm_chk",
      sql`${table.heightCm} is null or ${table.heightCm} between 50 and 250`
    ),
    index("player_profiles_organizationId_idx").on(table.organizationId),
  ]
);

export const playerProfileRelations = defineRelationsPart(
  { organizations, people, playerProfiles },
  (r) => ({
    playerProfiles: {
      organization: r.one.organizations({
        from: r.playerProfiles.organizationId,
        to: r.organizations.id,
      }),
      person: r.one.people({
        from: r.playerProfiles.personId,
        to: r.people.id,
      }),
    },
  })
);
