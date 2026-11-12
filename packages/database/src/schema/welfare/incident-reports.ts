/**
 * An accident, injury, illness or welfare incident at a session or match: what
 * happened, who was hurt, what was done and who was told. Health data about
 * the person, so keep it out of general lists and audit reads.
 *
 * Restrict on the person: incident history is kept, like safeguarding. Delete
 * or anonymise the person deliberately, not by cascade.
 */

import { defineRelationsPart, sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  check,
  foreignKey,
} from "drizzle-orm/pg-core";

import { organizations, users } from "../authentication";
import { venues } from "../club/venues";
import { teams } from "../football/teams";
import { people } from "../people/people";
import { isOneOf } from "../shared/constraints";

export const INCIDENT_KINDS = [
  "injury",
  "illness",
  "accident",
  "behaviour",
  "near_miss",
  "other",
] as const;
export type IncidentKind = (typeof INCIDENT_KINDS)[number];

export const INCIDENT_SEVERITIES = ["minor", "moderate", "serious"] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const incidentReports = pgTable(
  "incident_reports",
  {
    // What was done: "ice pack, rested, collected by mum".
    actionTaken: text("action_taken"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    description: text("description").notNull(),
    // Who gave first aid. Cleared if that person is deleted.
    firstAiderPersonId: uuid("first_aider_person_id").references(
      () => people.id,
      { onDelete: "set null" }
    ),
    followUpRequired: boolean("follow_up_required").default(false).notNull(),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    kind: text("kind").$type<IncidentKind>().notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // When parents or guardians were told. Null if not yet, or not needed.
    parentsNotifiedAt: timestamp("parents_notified_at", { withTimezone: true }),
    // Who it happened to.
    personId: uuid("person_id").notNull(),
    // The login that wrote the report. Cleared if that login is deleted.
    reportedBy: uuid("reported_by").references(() => users.id, {
      onDelete: "set null",
    }),
    severity: text("severity").$type<IncidentSeverity>().notNull(),
    teamId: uuid("team_id").references(() => teams.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    venueId: uuid("venue_id").references(() => venues.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId, table.personId],
      foreignColumns: [people.organizationId, people.id],
      name: "incident_reports_person_same_org_fkey",
    }).onDelete("restrict"),
    check("incidentReports_kind_chk", isOneOf(table.kind, INCIDENT_KINDS)),
    check(
      "incidentReports_severity_chk",
      isOneOf(table.severity, INCIDENT_SEVERITIES)
    ),
    index("incident_reports_firstAiderPersonId_idx").on(
      table.firstAiderPersonId
    ),
    index("incident_reports_organizationId_occurredAt_idx").on(
      table.organizationId,
      table.occurredAt
    ),
    index("incident_reports_personId_idx").on(table.personId),
    index("incident_reports_reportedBy_idx").on(table.reportedBy),
    index("incident_reports_teamId_idx").on(table.teamId),
    index("incident_reports_venueId_idx").on(table.venueId),
  ]
);

export const incidentReportRelations = defineRelationsPart(
  { incidentReports, organizations, people, teams, users, venues },
  (r) => ({
    incidentReports: {
      firstAider: r.one.people({
        from: r.incidentReports.firstAiderPersonId,
        to: r.people.id,
      }),
      organization: r.one.organizations({
        from: r.incidentReports.organizationId,
        to: r.organizations.id,
      }),
      person: r.one.people({
        from: r.incidentReports.personId,
        to: r.people.id,
      }),
      reporter: r.one.users({
        from: r.incidentReports.reportedBy,
        to: r.users.id,
      }),
      team: r.one.teams({
        from: r.incidentReports.teamId,
        to: r.teams.id,
      }),
      venue: r.one.venues({
        from: r.incidentReports.venueId,
        to: r.venues.id,
      }),
    },
  })
);
