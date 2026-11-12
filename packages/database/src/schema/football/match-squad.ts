/**
 * The players picked for a match and how they did: starter or substitute,
 * shirt number, position, minutes and goals. One row per match event and
 * player. The database cannot check that the event is a match, so the app must
 * only add squad rows to events with `kind = 'match'`.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { people } from "../people/people";
import { isOneOf } from "../shared/constraints";
import { events } from "./events";

export const SQUAD_ROLES = ["starter", "substitute"] as const;
export type SquadRole = (typeof SQUAD_ROLES)[number];

export const matchSquad = pgTable(
  "match_squad",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    eventId: uuid("event_id").notNull(),
    goals: integer("goals").default(0).notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    // Null until the match is played.
    minutesPlayed: integer("minutes_played"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    personId: uuid("person_id").notNull(),
    // Free text, such as "GK" or "Left wing". Formations differ by age group.
    position: text("position"),
    role: text("role").$type<SquadRole>().notNull(),
    shirtNumber: integer("shirt_number"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.eventId],
      foreignColumns: [events.organizationId, events.id],
      name: "match_squad_event_same_org_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "match_squad_person_same_org_fkey",
    }).onDelete("cascade"),
    check("matchSquad_role_chk", isOneOf(table.role, SQUAD_ROLES)),
    check("matchSquad_goals_chk", sql`${table.goals} >= 0`),
    check(
      "matchSquad_minutesPlayed_chk",
      sql`${table.minutesPlayed} is null or ${table.minutesPlayed} between 0 and 200`
    ),
    check(
      "matchSquad_shirtNumber_chk",
      sql`${table.shirtNumber} is null or ${table.shirtNumber} between 0 and 999`
    ),
    index("match_squad_organizationId_idx").on(table.organizationId),
    index("match_squad_personId_idx").on(table.personId),
    uniqueIndex("match_squad_event_person_uidx").on(
      table.eventId,
      table.personId
    ),
  ]
);

export const matchSquadRelations = defineRelationsPart(
  { events, matchSquad, organizations, people },
  (r) => ({
    matchSquad: {
      event: r.one.events({
        from: r.matchSquad.eventId,
        to: r.events.id,
      }),
      organization: r.one.organizations({
        from: r.matchSquad.organizationId,
        to: r.organizations.id,
      }),
      person: r.one.people({
        from: r.matchSquad.personId,
        to: r.people.id,
      }),
    },
  })
);
