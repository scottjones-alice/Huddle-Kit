/**
 * Links between people: a child to their parent, guardian or carer. Each row
 * reads "`relatedPerson` is the `relationship` of `person`", so `person` is
 * the child and `relatedPerson` is the adult. The flags say what that adult
 * may do, because being someone's contact is not the same as having parental
 * responsibility or being allowed to collect them.
 *
 * Personal data about children and their families. Keep it out of general
 * lists and views.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  foreignKey,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { isOneOf } from "../shared/constraints";
import { people } from "./people";

export const RELATIONSHIP_KINDS = [
  "parent",
  "guardian",
  "carer",
  "grandparent",
  "other",
] as const;
export type RelationshipKind = (typeof RELATIONSHIP_KINDS)[number];

export const personRelationships = pgTable(
  "person_relationships",
  {
    // May this adult take the child home from a session.
    canCollect: boolean("can_collect").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Legal say over the child, such as consenting to medical treatment.
    hasParentalResponsibility: boolean("has_parental_responsibility")
      .default(false)
      .notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    // Call this adult in an emergency.
    isEmergencyContact: boolean("is_emergency_contact")
      .default(false)
      .notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // The child (or whoever the relationship is about).
    personId: uuid("person_id").notNull(),
    // The adult.
    relatedPersonId: uuid("related_person_id").notNull(),
    relationship: text("relationship").$type<RelationshipKind>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "person_relationships_person_same_org_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.relatedPersonId],
      foreignColumns: [people.organizationId, people.id],
      name: "person_relationships_related_person_same_org_fkey",
    }).onDelete("cascade"),
    check(
      "personRelationships_relationship_chk",
      isOneOf(table.relationship, RELATIONSHIP_KINDS)
    ),
    check(
      "personRelationships_notSelf_chk",
      sql`${table.personId} <> ${table.relatedPersonId}`
    ),
    index("person_relationships_organizationId_idx").on(table.organizationId),
    index("person_relationships_relatedPersonId_idx").on(table.relatedPersonId),
    uniqueIndex("person_relationships_person_related_kind_uidx").on(
      table.personId,
      table.relatedPersonId,
      table.relationship
    ),
  ]
);

/**
 * Only the relationship's own relations are declared. Parts merge per table, so
 * adding relationships to `people` here would replace its relations.
 */
export const personRelationshipRelations = defineRelationsPart(
  { organizations, people, personRelationships },
  (r) => ({
    personRelationships: {
      organization: r.one.organizations({
        from: r.personRelationships.organizationId,
        to: r.organizations.id,
      }),
      person: r.one.people({
        from: r.personRelationships.personId,
        to: r.people.id,
      }),
      relatedPerson: r.one.people({
        from: r.personRelationships.relatedPersonId,
        to: r.people.id,
      }),
    },
  })
);
