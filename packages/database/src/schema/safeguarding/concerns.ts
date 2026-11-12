/**
 * A safeguarding concern raised about a person (usually a child's welfare).
 * The most sensitive table in the system.
 *
 * - `summary` is a short line safe to show to the people handling the case.
 *   `details` is the full account and should be encrypted by the application
 *   before it is stored. Neither belongs in an audit event's `metadata`.
 * - Every read and change must write an `audit_events` row. Only roles
 *   `safeguarding_lead` and `safeguarding_deputy` (see `role_assignments`)
 *   should be able to read this table.
 * - Never deleted by cascade: the subject person and the organization are
 *   `restrict`. Closing a concern sets `status` and `closedAt`; the row stays.
 * - What happened afterwards is recorded in `safeguarding_notes`.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  foreignKey,
  unique,
} from "drizzle-orm/pg-core";

import { organizations, users } from "../authentication";
import { people } from "../people/people";
import { isOneOf } from "../shared/constraints";

export const CONCERN_STATUSES = [
  "open",
  "under_review",
  "referred",
  "closed",
] as const;
export type ConcernStatus = (typeof CONCERN_STATUSES)[number];

export const CONCERN_SEVERITIES = [
  "low",
  "medium",
  "high",
  "immediate_risk",
] as const;
export type ConcernSeverity = (typeof CONCERN_SEVERITIES)[number];

export const safeguardingConcerns = pgTable(
  "safeguarding_concerns",
  {
    // The lead handling it. Cleared if that login is deleted.
    assignedTo: uuid("assigned_to").references(() => users.id, {
      onDelete: "set null",
    }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    closedReason: text("closed_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Full account. Encrypt in the application before storing.
    details: text("details"),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    openedAt: timestamp("opened_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Restrict: safeguarding records outlive the organization account.
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    // Who raised it. Cleared if that login is deleted.
    raisedBy: uuid("raised_by").references(() => users.id, {
      onDelete: "set null",
    }),
    referredAt: timestamp("referred_at", { withTimezone: true }),
    // Who it was passed to: "LADO", "police", "County FA safeguarding team".
    referredTo: text("referred_to"),
    severity: text("severity").$type<ConcernSeverity>().notNull(),
    status: text("status").$type<ConcernStatus>().default("open").notNull(),
    // The person the concern is about. Restrict: never deleted by cascade.
    subjectPersonId: uuid("subject_person_id").notNull(),
    // Short and safe to show to the people handling the case.
    summary: text("summary").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.subjectPersonId],
      foreignColumns: [people.organizationId, people.id],
      name: "safeguarding_concerns_subject_person_same_org_fkey",
    }).onDelete("restrict"),
    // Lets other tables reference (organization_id, id) so both must match.
    unique("safeguarding_concerns_organization_id_id_uniq").on(
      table.organizationId,
      table.id
    ),
    check(
      "safeguardingConcerns_status_chk",
      isOneOf(table.status, CONCERN_STATUSES)
    ),
    check(
      "safeguardingConcerns_severity_chk",
      isOneOf(table.severity, CONCERN_SEVERITIES)
    ),
    // A concern is closed exactly when it has a closing time.
    check(
      "safeguardingConcerns_closed_chk",
      sql`(${table.status} = 'closed') = (${table.closedAt} is not null)`
    ),
    index("safeguarding_concerns_assignedTo_idx").on(table.assignedTo),
    index("safeguarding_concerns_organizationId_status_idx").on(
      table.organizationId,
      table.status
    ),
    index("safeguarding_concerns_raisedBy_idx").on(table.raisedBy),
    index("safeguarding_concerns_subjectPersonId_idx").on(
      table.subjectPersonId
    ),
  ]
);

/**
 * Notes are not listed here: `safeguarding_notes` imports this table, so listing
 * them would create an import cycle. Load notes from `db.query.safeguardingNotes`.
 */
export const safeguardingConcernRelations = defineRelationsPart(
  { organizations, people, safeguardingConcerns, users },
  (r) => ({
    safeguardingConcerns: {
      assignee: r.one.users({
        from: r.safeguardingConcerns.assignedTo,
        to: r.users.id,
      }),
      organization: r.one.organizations({
        from: r.safeguardingConcerns.organizationId,
        to: r.organizations.id,
      }),
      raiser: r.one.users({
        from: r.safeguardingConcerns.raisedBy,
        to: r.users.id,
      }),
      subject: r.one.people({
        from: r.safeguardingConcerns.subjectPersonId,
        to: r.people.id,
      }),
    },
  })
);
