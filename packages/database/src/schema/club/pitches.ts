/**
 * A pitch at a venue: "Pitch 2, 9v9, 3G". Venues are places; pitches are the
 * playable areas inside them, so a training ground with three pitches is one
 * venue and three pitches. Deleting the venue deletes its pitches.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { isOneOf } from "../shared/constraints";
import { venues } from "./venues";

export const PITCH_SURFACES = [
  "grass",
  "3g",
  "4g",
  "astroturf",
  "indoor",
  "other",
] as const;
export type PitchSurface = (typeof PITCH_SURFACES)[number];

export const PITCH_FORMATS = ["5v5", "7v7", "9v9", "11v11", "other"] as const;
export type PitchFormat = (typeof PITCH_FORMATS)[number];

export const pitches = pgTable(
  "pitches",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    format: text("format").$type<PitchFormat>().notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    isActive: boolean("is_active").default(true).notNull(),
    name: text("name").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    surface: text("surface").$type<PitchSurface>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    venueId: uuid("venue_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.venueId],
      foreignColumns: [venues.organizationId, venues.id],
      name: "pitches_venue_same_org_fkey",
    }).onDelete("cascade"),
    unique("pitches_organization_id_id_uniq").on(
      table.organizationId,
      table.id
    ),
    check("pitches_format_chk", isOneOf(table.format, PITCH_FORMATS)),
    check("pitches_surface_chk", isOneOf(table.surface, PITCH_SURFACES)),
    check("pitches_name_chk", sql`length(trim(${table.name})) > 0`),
    index("pitches_organizationId_idx").on(table.organizationId),
    uniqueIndex("pitches_venueId_name_uidx").on(table.venueId, table.name),
  ]
);

export const pitchRelations = defineRelationsPart(
  { organizations, pitches, venues },
  (r) => ({
    pitches: {
      organization: r.one.organizations({
        from: r.pitches.organizationId,
        to: r.organizations.id,
      }),
      venue: r.one.venues({
        from: r.pitches.venueId,
        to: r.venues.id,
      }),
    },
  })
);
