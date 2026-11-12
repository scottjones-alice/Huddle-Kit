/**
 * The teams a `teams`-scoped role assignment covers: a coach of U12 Boys has
 * one row here for that team and sees only that squad. Deleting the assignment
 * or the team deletes the row.
 *
 * The row's `organizationId` must match both the assignment's and the team's,
 * enforced by composite foreign keys, so an assignment can never be pointed at
 * another organization's team.
 *
 * This file also holds the relations for `role_assignments`. Relations merge
 * per table, and `role_assignments` can only list its teams (through this
 * table) by importing it, while this table already imports `role_assignments`.
 * Declaring both parts here avoids the import cycle.
 */

import { defineRelationsPart } from "drizzle-orm";
import {
  foreignKey,
  index,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { organizations, users } from "../authentication";
import { teams } from "../football/teams";
import { roleAssignments } from "./role-assignments";

export const roleAssignmentTeams = pgTable(
  "role_assignment_teams",
  {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    roleAssignmentId: uuid("role_assignment_id").notNull(),
    teamId: uuid("team_id").notNull(),
  },
  (table) => [
    // Both links must be in this row's organization, so a role assignment can
    // never be pointed at another club's team.
    foreignKey({
      columns: [table.organizationId, table.roleAssignmentId],
      foreignColumns: [roleAssignments.organizationId, roleAssignments.id],
      name: "role_assignment_teams_assignment_same_org_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.teamId],
      foreignColumns: [teams.organizationId, teams.id],
      name: "role_assignment_teams_team_same_org_fkey",
    }).onDelete("cascade"),
    index("role_assignment_teams_organizationId_idx").on(table.organizationId),
    primaryKey({
      columns: [table.roleAssignmentId, table.teamId],
      name: "role_assignment_teams_pk",
    }),
    index("role_assignment_teams_teamId_idx").on(table.teamId),
  ]
);

export const roleAssignmentRelations = defineRelationsPart(
  { organizations, roleAssignmentTeams, roleAssignments, teams, users },
  (r) => ({
    roleAssignmentTeams: {
      roleAssignment: r.one.roleAssignments({
        from: r.roleAssignmentTeams.roleAssignmentId,
        to: r.roleAssignments.id,
      }),
      team: r.one.teams({
        from: r.roleAssignmentTeams.teamId,
        to: r.teams.id,
      }),
    },
    roleAssignments: {
      granter: r.one.users({
        from: r.roleAssignments.grantedBy,
        to: r.users.id,
      }),
      organization: r.one.organizations({
        from: r.roleAssignments.organizationId,
        to: r.organizations.id,
      }),
      teams: r.many.teams({
        from: r.roleAssignments.id.through(
          r.roleAssignmentTeams.roleAssignmentId
        ),
        to: r.teams.id.through(r.roleAssignmentTeams.teamId),
      }),
      user: r.one.users({
        from: r.roleAssignments.userId,
        to: r.users.id,
      }),
    },
  })
);
