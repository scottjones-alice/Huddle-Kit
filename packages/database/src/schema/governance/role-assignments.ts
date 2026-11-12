/**
 * Who may do what inside an organization. Better Auth's `members.role` says
 * someone belongs to the organization; this table gives them the fine-grained
 * jobs (coach, welfare officer, safeguarding lead) that decide which records
 * they may see.
 *
 * `scope` says how far a role reaches:
 * - `organization`: everything in the organization.
 * - `teams`: only the teams listed in `role_assignment_teams`. Fail-safe: a
 *   `teams` assignment with no teams listed grants access to nothing.
 *
 * Only coaching, team and volunteer roles can be team-scoped (see
 * `TEAM_SCOPED_ROLES`). Admin, secretary, treasurer, welfare and safeguarding
 * roles are organization-wide, and a check constraint enforces that.
 *
 * Ending an assignment sets `endsAt` and keeps the row, so there is a record of
 * who held a role and when. The relations for this table live in
 * `role-assignment-teams.ts`; see the note there.
 */

import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  unique,
} from "drizzle-orm/pg-core";

import { organizations, users } from "../authentication";
import { isOneOf } from "../shared/constraints";

export const ROLE_ASSIGNMENT_ROLES = [
  "admin",
  "secretary",
  "treasurer",
  "head_coach",
  "coach",
  "assistant_coach",
  "team_manager",
  "first_aider",
  "volunteer",
  "welfare_officer",
  "safeguarding_lead",
  "safeguarding_deputy",
] as const;

/** Roles that can be limited to specific teams. All others are organization-wide. */
export const TEAM_SCOPED_ROLES = [
  "head_coach",
  "coach",
  "assistant_coach",
  "team_manager",
  "first_aider",
  "volunteer",
] as const;
export type RoleAssignmentRole = (typeof ROLE_ASSIGNMENT_ROLES)[number];

export const ROLE_ASSIGNMENT_SCOPES = ["organization", "teams"] as const;
export type RoleAssignmentScope = (typeof ROLE_ASSIGNMENT_SCOPES)[number];

export const roleAssignments = pgTable(
  "role_assignments",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // When the role stopped applying. Null while it is active.
    endsAt: timestamp("ends_at", { withTimezone: true }),
    // Who gave the role. Kept as history, cleared if that login is deleted.
    grantedBy: uuid("granted_by").references(() => users.id, {
      onDelete: "set null",
    }),
    id: uuid("id")
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: text("role").$type<RoleAssignmentRole>().notNull(),
    // No default on purpose: say how far the role reaches every time.
    scope: text("scope").$type<RoleAssignmentScope>().notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    // The login that holds the role.
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    // Lets other tables reference (organization_id, id) so both must match.
    unique("role_assignments_organization_id_id_uniq").on(
      table.organizationId,
      table.id
    ),
    check(
      "roleAssignments_role_chk",
      isOneOf(table.role, ROLE_ASSIGNMENT_ROLES)
    ),
    check(
      "roleAssignments_scope_chk",
      isOneOf(table.scope, ROLE_ASSIGNMENT_SCOPES)
    ),
    check(
      "roleAssignments_dates_chk",
      sql`${table.endsAt} is null or ${table.endsAt} >= ${table.startsAt}`
    ),
    check(
      "roleAssignments_teamScope_chk",
      sql`${table.scope} = 'organization' or ${isOneOf(table.role, TEAM_SCOPED_ROLES)}`
    ),
    index("role_assignments_grantedBy_idx").on(table.grantedBy),
    index("role_assignments_organizationId_userId_idx").on(
      table.organizationId,
      table.userId
    ),
    index("role_assignments_userId_idx").on(table.userId),
    // A login holds each role at most once at a time.
    uniqueIndex("role_assignments_active_uidx")
      .on(table.organizationId, table.userId, table.role)
      .where(sql`${table.endsAt} is null`),
  ]
);
