/**
 * What a person (or their parent) has agreed to: photos and video, medical
 * treatment, travel. One row is one grant. Withdrawing sets `withdrawnAt` and
 * keeps the row, so there is a record of what was agreed and when it stopped.
 *
 * At most one active grant per person and type, enforced by a partial unique
 * index. To record a new grant after withdrawal, insert a new row.
 *
 * A child's consent is given by an adult: set `grantedByPersonId` to that adult.
 * Leave it null when the person consented for themselves.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
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
import { files } from "../files/files";
import { people } from "../people/people";
import { isOneOf } from "../shared/constraints";
import { consentDocuments } from "./consent-documents";
import { CONSENT_TYPES } from "./consent-types";
import type { ConsentType } from "./consent-types";

export const consents = pgTable(
  "consents",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // The wording the person agreed to. Null for consents recorded before
    // versioning. Its type must match this consent's type.
    documentId: uuid("document_id"),
    // Null means it does not expire.
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    // The signed form, if there is one. Cleared if the file is deleted.
    fileId: uuid("file_id").references(() => files.id, {
      onDelete: "set null",
    }),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull(),
    // The adult who agreed on the person's behalf. Null if they agreed themselves.
    grantedByPersonId: uuid("granted_by_person_id").references(
      () => people.id,
      { onDelete: "set null" }
    ),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    notes: text("notes"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // Who the consent is about.
    personId: uuid("person_id").notNull(),
    type: text("type").$type<ConsentType>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    // When it was taken back. Null while it still stands.
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "consents_person_same_org_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.documentId, table.type],
      foreignColumns: [
        consentDocuments.organizationId,
        consentDocuments.id,
        consentDocuments.type,
      ],
      name: "consents_document_same_org_fkey",
    }).onDelete("restrict"),
    index("consents_documentId_idx").on(table.documentId),
    check("consents_type_chk", isOneOf(table.type, CONSENT_TYPES)),
    check(
      "consents_dates_chk",
      sql`(${table.withdrawnAt} is null or ${table.withdrawnAt} >= ${table.grantedAt}) and (${table.expiresAt} is null or ${table.expiresAt} > ${table.grantedAt})`
    ),
    index("consents_fileId_idx").on(table.fileId),
    index("consents_grantedByPersonId_idx").on(table.grantedByPersonId),
    index("consents_organizationId_idx").on(table.organizationId),
    uniqueIndex("consents_active_uidx")
      .on(table.personId, table.type)
      .where(sql`${table.withdrawnAt} is null`),
  ]
);

export const consentRelations = defineRelationsPart(
  { consentDocuments, consents, files, organizations, people },
  (r) => ({
    consents: {
      document: r.one.consentDocuments({
        from: r.consents.documentId,
        to: r.consentDocuments.id,
      }),
      file: r.one.files({
        from: r.consents.fileId,
        to: r.files.id,
      }),
      grantedBy: r.one.people({
        from: r.consents.grantedByPersonId,
        to: r.people.id,
      }),
      organization: r.one.organizations({
        from: r.consents.organizationId,
        to: r.organizations.id,
      }),
      person: r.one.people({
        from: r.consents.personId,
        to: r.people.id,
      }),
    },
  })
);
