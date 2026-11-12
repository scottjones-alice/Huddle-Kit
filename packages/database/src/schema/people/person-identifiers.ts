/**
 * Identifiers issued to a person by outside bodies, such as an FA FAN
 * (Football Association Number) or a league registration number. Kept apart
 * from `people` because a person can have several, and each has its own issuer.
 *
 * A person has at most one identifier of each type, and the same value of the
 * same type cannot belong to two people in an organization.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { isOneOf } from "../shared/constraints";
import { people } from "./people";

export const IDENTIFIER_TYPES = [
  "fa_fan",
  "league_registration",
  "school",
  "other",
] as const;
export type IdentifierType = (typeof IDENTIFIER_TYPES)[number];

export const personIdentifiers = pgTable(
  "person_identifiers",
  {
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
    type: text("type").$type<IdentifierType>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    value: text("value").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "person_identifiers_person_same_org_fkey",
    }).onDelete("cascade"),
    check("personIdentifiers_type_chk", isOneOf(table.type, IDENTIFIER_TYPES)),
    check("personIdentifiers_value_chk", sql`length(trim(${table.value})) > 0`),
    index("person_identifiers_organizationId_idx").on(table.organizationId),
    uniqueIndex("person_identifiers_person_type_uidx").on(
      table.personId,
      table.type
    ),
    uniqueIndex("person_identifiers_org_type_value_uidx").on(
      table.organizationId,
      table.type,
      table.value
    ),
  ]
);

export const personIdentifierRelations = defineRelationsPart(
  { organizations, people, personIdentifiers },
  (r) => ({
    personIdentifiers: {
      organization: r.one.organizations({
        from: r.personIdentifiers.organizationId,
        to: r.organizations.id,
      }),
      person: r.one.people({
        from: r.personIdentifiers.personId,
        to: r.people.id,
      }),
    },
  })
);
