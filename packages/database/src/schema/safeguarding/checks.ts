/**
 * Safeguarding checks on the adults who work with children: DBS, safeguarding
 * training, first aid, references. Records that a check was done, by whom and
 * when it runs out. It does NOT store certificate contents: keep the scan in
 * `files` (linked by `fileId`) and only the certificate reference here.
 *
 * Expiry is derived from `expiresOn`, not stored as a status, so it cannot go
 * stale. A person with checks cannot be deleted (restrict), and neither can
 * the organization, because these are safeguarding records.
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

import { organizations, users } from "../authentication";
import { files } from "../files/files";
import { people } from "../people/people";
import { isOneOf } from "../shared/constraints";

export const SAFEGUARDING_CHECK_KINDS = [
  "dbs",
  "safeguarding_training",
  "first_aid",
  "reference",
] as const;
export type SafeguardingCheckKind = (typeof SAFEGUARDING_CHECK_KINDS)[number];

export const SAFEGUARDING_CHECK_STATUSES = [
  "pending",
  "valid",
  "rejected",
  "revoked",
] as const;
export type SafeguardingCheckStatus =
  (typeof SAFEGUARDING_CHECK_STATUSES)[number];

export const DBS_LEVELS = [
  "basic",
  "standard",
  "enhanced",
  "enhanced_barred_list",
] as const;
export type DbsLevel = (typeof DBS_LEVELS)[number];

export const safeguardingChecks = pgTable(
  "safeguarding_checks",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // DBS checks only: the level of disclosure.
    dbsLevel: text("dbs_level").$type<DbsLevel>(),
    // DBS checks only: subscribed to the DBS Update Service, so it can be re-checked online.
    dbsUpdateService: boolean("dbs_update_service").default(false).notNull(),
    // Calendar dates with no time or timezone, kept as "YYYY-MM-DD".
    expiresOn: date("expires_on", { mode: "string" }),
    // The scanned certificate or evidence. Cleared if the file is deleted.
    fileId: uuid("file_id").references(() => files.id, {
      onDelete: "set null",
    }),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    issuedOn: date("issued_on", { mode: "string" }),
    kind: text("kind").$type<SafeguardingCheckKind>().notNull(),
    // Restrict: safeguarding records outlive the organization account.
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    // The adult the check is about.
    personId: uuid("person_id").notNull(),
    // Certificate number or course reference. Not the certificate itself.
    reference: text("reference"),
    status: text("status")
      .$type<SafeguardingCheckStatus>()
      .default("pending")
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    // The login that checked it. Cleared if that login is deleted.
    verifiedBy: uuid("verified_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "safeguarding_checks_person_same_org_fkey",
    }).onDelete("restrict"),
    check(
      "safeguardingChecks_kind_chk",
      isOneOf(table.kind, SAFEGUARDING_CHECK_KINDS)
    ),
    check(
      "safeguardingChecks_status_chk",
      isOneOf(table.status, SAFEGUARDING_CHECK_STATUSES)
    ),
    check(
      "safeguardingChecks_dbsLevel_chk",
      sql`${table.dbsLevel} is null or ${isOneOf(table.dbsLevel, DBS_LEVELS)}`
    ),
    check(
      "safeguardingChecks_dbsOnly_chk",
      sql`${table.kind} = 'dbs' or (${table.dbsLevel} is null and ${table.dbsUpdateService} = false)`
    ),
    check(
      "safeguardingChecks_dates_chk",
      sql`${table.expiresOn} is null or ${table.issuedOn} is null or ${table.expiresOn} >= ${table.issuedOn}`
    ),
    index("safeguarding_checks_fileId_idx").on(table.fileId),
    index("safeguarding_checks_organizationId_idx").on(table.organizationId),
    index("safeguarding_checks_personId_kind_idx").on(
      table.personId,
      table.kind
    ),
    index("safeguarding_checks_verifiedBy_idx").on(table.verifiedBy),
  ]
);

export const safeguardingCheckRelations = defineRelationsPart(
  { files, organizations, people, safeguardingChecks, users },
  (r) => ({
    safeguardingChecks: {
      file: r.one.files({
        from: r.safeguardingChecks.fileId,
        to: r.files.id,
      }),
      organization: r.one.organizations({
        from: r.safeguardingChecks.organizationId,
        to: r.organizations.id,
      }),
      person: r.one.people({
        from: r.safeguardingChecks.personId,
        to: r.people.id,
      }),
      verifier: r.one.users({
        from: r.safeguardingChecks.verifiedBy,
        to: r.users.id,
      }),
    },
  })
);
