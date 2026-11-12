/**
 * The wording of a consent form at a point in time, so a grant can say exactly
 * what the person agreed to. Wording changes by publishing a new version (the
 * next number for that type), never by editing an old one: a database trigger
 * rejects changes to the wording of a published document. Only `retiredAt` can
 * change, to stop offering a version.
 *
 * `consents.documentId` points at the version that was agreed to. A document
 * that any consent refers to cannot be deleted.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations } from "../authentication";
import { isOneOf } from "../shared/constraints";
import { CONSENT_TYPES } from "./consent-types";
import type { ConsentType } from "./consent-types";

export const consentDocuments = pgTable(
  "consent_documents",
  {
    // The full wording shown to the person or parent.
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Set when this version should no longer be offered. Old grants stay valid.
    retiredAt: timestamp("retired_at", { withTimezone: true }),
    title: text("title").notNull(),
    type: text("type").$type<ConsentType>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    version: integer("version").notNull(),
  },
  (table) => [
    unique("consent_documents_organization_id_id_uniq").on(
      table.organizationId,
      table.id
    ),
    // Lets `consents` reference (organization_id, id, type), so a consent can
    // only point at a document of its own type.
    unique("consent_documents_org_id_type_uniq").on(
      table.organizationId,
      table.id,
      table.type
    ),
    unique("consent_documents_org_type_version_uniq").on(
      table.organizationId,
      table.type,
      table.version
    ),
    check("consentDocuments_type_chk", isOneOf(table.type, CONSENT_TYPES)),
    check("consentDocuments_version_chk", sql`${table.version} >= 1`),
    check("consentDocuments_body_chk", sql`length(trim(${table.body})) > 0`),
    check("consentDocuments_title_chk", sql`length(trim(${table.title})) > 0`),
    index("consent_documents_organizationId_idx").on(table.organizationId),
  ]
);

export const consentDocumentRelations = defineRelationsPart(
  { consentDocuments, organizations },
  (r) => ({
    consentDocuments: {
      organization: r.one.organizations({
        from: r.consentDocuments.organizationId,
        to: r.organizations.id,
      }),
    },
  })
);
