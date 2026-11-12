/**
 * An allergy a person has, with how bad it is and what to do. Health data, so
 * special-category under UK GDPR: keep it out of general lists, and write an
 * audit event when it is read.
 *
 * Deleting the person deletes their allergies (erasure), unlike safeguarding
 * records which are kept.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  check,
  foreignKey,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { isOneOf } from "../shared/constraints";
import { people } from "./people";

export const ALLERGY_SEVERITIES = [
  "mild",
  "moderate",
  "severe",
  "life_threatening",
] as const;
export type AllergySeverity = (typeof ALLERGY_SEVERITIES)[number];

export const allergies = pgTable(
  "allergies",
  {
    // What they react to: "peanuts", "bee stings", "penicillin".
    allergen: text("allergen").notNull(),
    // Set when the allergy no longer applies. The row stays: it is part of the person's history.
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    personId: uuid("person_id").notNull(),
    // What happens: "hives and swollen lips".
    reaction: text("reaction"),
    severity: text("severity").$type<AllergySeverity>().notNull(),
    // What to do: "two EpiPens in the red bag, call 999".
    treatment: text("treatment"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "allergies_person_same_org_fkey",
    }).onDelete("cascade"),
    check(
      "allergies_severity_chk",
      isOneOf(table.severity, ALLERGY_SEVERITIES)
    ),
    index("allergies_organizationId_idx").on(table.organizationId),
    uniqueIndex("allergies_personId_allergen_uidx").on(
      table.personId,
      table.allergen
    ),
  ]
);

export const allergyRelations = defineRelationsPart(
  { allergies, organizations, people },
  (r) => ({
    allergies: {
      organization: r.one.organizations({
        from: r.allergies.organizationId,
        to: r.organizations.id,
      }),
      person: r.one.people({
        from: r.allergies.personId,
        to: r.people.id,
      }),
    },
  })
);
