/**
 * Extra facts for an event of kind `match`: who we played, home or away, and
 * the score. One row per match event (the event id is the primary key). The
 * database cannot check that the event is a match, so the app must only create
 * rows for events with `kind = 'match'`.
 *
 * Scores are from our point of view: `goalsFor` is ours. Both are null until
 * the match is played; they are set together.
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
import { opponents } from "../club/opponents";
import { isOneOf } from "../shared/constraints";
import { events } from "./events";

export const HOME_AWAY_VALUES = ["home", "away", "neutral"] as const;
export type HomeAway = (typeof HOME_AWAY_VALUES)[number];

export const matchDetails = pgTable(
  "match_details",
  {
    // League, cup or friendly name, such as "County Cup Round 2".
    competition: text("competition"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    eventId: uuid("event_id").notNull(),
    goalsAgainst: integer("goals_against"),
    goalsFor: integer("goals_for"),
    homeAway: text("home_away").$type<HomeAway>().notNull(),
    // Restrict: an opponent with fixtures cannot be deleted.
    opponentId: uuid("opponent_id").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.eventId], name: "match_details_pk" }),
    foreignKey({
      columns: [table.organizationId, table.eventId],
      foreignColumns: [events.organizationId, events.id],
      name: "match_details_event_same_org_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.opponentId],
      foreignColumns: [opponents.organizationId, opponents.id],
      name: "match_details_opponent_same_org_fkey",
    }).onDelete("restrict"),
    check(
      "matchDetails_homeAway_chk",
      isOneOf(table.homeAway, HOME_AWAY_VALUES)
    ),
    check(
      "matchDetails_score_chk",
      sql`(${table.goalsFor} is null) = (${table.goalsAgainst} is null) and (${table.goalsFor} is null or (${table.goalsFor} >= 0 and ${table.goalsAgainst} >= 0))`
    ),
    index("match_details_opponentId_idx").on(table.opponentId),
    index("match_details_organizationId_idx").on(table.organizationId),
  ]
);

export const matchDetailRelations = defineRelationsPart(
  { events, matchDetails, opponents, organizations },
  (r) => ({
    matchDetails: {
      event: r.one.events({
        from: r.matchDetails.eventId,
        to: r.events.id,
      }),
      opponent: r.one.opponents({
        from: r.matchDetails.opponentId,
        to: r.opponents.id,
      }),
      organization: r.one.organizations({
        from: r.matchDetails.organizationId,
        to: r.organizations.id,
      }),
    },
  })
);
