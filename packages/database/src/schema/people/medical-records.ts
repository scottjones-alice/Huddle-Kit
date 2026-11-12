/**
 * A medical condition, medication or disability a coach or first aider needs
 * to know about. Health data, so special-category under UK GDPR: keep it out of
 * general lists, and write an audit event when it is read. Allergies have their
 * own table because they carry a severity and a treatment.
 *
 * Deleting the person deletes their medical records (erasure).
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  foreignKey,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { isOneOf } from "../shared/constraints";
import { people } from "./people";

export const MEDICAL_RECORD_KINDS = [
  "condition",
  "medication",
  "disability",
  "other",
] as const;
export type MedicalRecordKind = (typeof MEDICAL_RECORD_KINDS)[number];

export const medicalRecords = pgTable(
  "medical_records",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    details: text("details"),
    // What to do in an emergency, for the first aider.
    emergencyNotes: text("emergency_notes"),
    // Calendar dates with no time or timezone, kept as "YYYY-MM-DD".
    endedOn: date("ended_on", { mode: "string" }),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    // Show to whoever is first on the scene, not only to the welfare officer.
    isEmergencyRelevant: boolean("is_emergency_relevant")
      .default(false)
      .notNull(),
    kind: text("kind").$type<MedicalRecordKind>().notNull(),
    // "Asthma", "Ventolin inhaler".
    name: text("name").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    personId: uuid("person_id").notNull(),
    startedOn: date("started_on", { mode: "string" }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "medical_records_person_same_org_fkey",
    }).onDelete("cascade"),
    check("medicalRecords_kind_chk", isOneOf(table.kind, MEDICAL_RECORD_KINDS)),
    check(
      "medicalRecords_dates_chk",
      sql`${table.endedOn} is null or ${table.startedOn} is null or ${table.endedOn} >= ${table.startedOn}`
    ),
    index("medical_records_organizationId_idx").on(table.organizationId),
    index("medical_records_personId_idx").on(table.personId),
  ]
);

export const medicalRecordRelations = defineRelationsPart(
  { medicalRecords, organizations, people },
  (r) => ({
    medicalRecords: {
      organization: r.one.organizations({
        from: r.medicalRecords.organizationId,
        to: r.organizations.id,
      }),
      person: r.one.people({
        from: r.medicalRecords.personId,
        to: r.people.id,
      }),
    },
  })
);
