/**
 * Coaching and refereeing qualifications held by volunteers and staff, such as
 * an FA Level 2 badge. Safeguarding training, first aid and DBS are *checks*,
 * not qualifications, and live in `safeguarding_checks`.
 *
 * Expiry is derived from `expiresOn`, not stored as a status. The certificate
 * scan lives in `files` and is linked by `fileId`.
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
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { files } from "../files/files";
import { isOneOf } from "../shared/constraints";
import { people } from "./people";

export const QUALIFICATION_KINDS = [
  "coaching",
  "refereeing",
  "first_aid",
  "other",
] as const;
export type QualificationKind = (typeof QUALIFICATION_KINDS)[number];

export const qualifications = pgTable(
  "qualifications",
  {
    // The body that awarded it, such as "The FA".
    awardedBy: text("awarded_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresOn: date("expires_on", { mode: "string" }),
    // The certificate scan. Cleared if the file is deleted.
    fileId: uuid("file_id").references(() => files.id, {
      onDelete: "set null",
    }),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    issuedOn: date("issued_on", { mode: "string" }),
    kind: text("kind").$type<QualificationKind>().notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    personId: uuid("person_id").notNull(),
    // Certificate number. Not the certificate itself.
    reference: text("reference"),
    title: text("title").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "qualifications_person_same_org_fkey",
    }).onDelete("cascade"),
    check("qualifications_kind_chk", isOneOf(table.kind, QUALIFICATION_KINDS)),
    check(
      "qualifications_dates_chk",
      sql`${table.expiresOn} is null or ${table.issuedOn} is null or ${table.expiresOn} >= ${table.issuedOn}`
    ),
    check("qualifications_title_chk", sql`length(trim(${table.title})) > 0`),
    index("qualifications_fileId_idx").on(table.fileId),
    index("qualifications_organizationId_idx").on(table.organizationId),
    index("qualifications_personId_idx").on(table.personId),
  ]
);

export const qualificationRelations = defineRelationsPart(
  { files, organizations, people, qualifications },
  (r) => ({
    qualifications: {
      file: r.one.files({
        from: r.qualifications.fileId,
        to: r.files.id,
      }),
      organization: r.one.organizations({
        from: r.qualifications.organizationId,
        to: r.organizations.id,
      }),
      person: r.one.people({
        from: r.qualifications.personId,
        to: r.people.id,
      }),
    },
  })
);
