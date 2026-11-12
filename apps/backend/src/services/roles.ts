import {
  TEAM_SCOPED_ROLES,
  members,
  roleAssignmentTeams,
  roleAssignments,
  teams,
  users,
} from "@alice/database";
import type {
  Database,
  RoleAssignmentRole,
  RoleAssignmentScope,
} from "@alice/database";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";

import { conflict, invalid, notFound } from "@/lib/app-error";
import { isUniqueViolation } from "@/lib/sql-errors";

const isTeamScopedRole = (role: RoleAssignmentRole): boolean =>
  TEAM_SCOPED_ROLES.some((scoped) => scoped === role);

/** The people with a login to this club, with their Better Auth roles. */
export const listClubMembers = async (db: Database, organizationId: string) =>
  await db
    .select({
      email: users.email,
      joinedAt: members.createdAt,
      memberId: members.id,
      name: users.name,
      role: members.role,
      userId: users.id,
    })
    .from(members)
    .innerJoin(users, eq(users.id, members.userId))
    .where(eq(members.organizationId, organizationId))
    .orderBy(asc(users.name));

/** Jobs with the teams they are limited to. Ended jobs are kept as history. */
export const listRoleAssignments = async (
  db: Database,
  organizationId: string,
  includeEnded: boolean
) => {
  const rows = await db
    .select()
    .from(roleAssignments)
    .where(
      and(
        eq(roleAssignments.organizationId, organizationId),
        includeEnded ? undefined : isNull(roleAssignments.endsAt)
      )
    )
    .orderBy(desc(roleAssignments.createdAt));
  const links =
    rows.length === 0
      ? []
      : await db
          .select()
          .from(roleAssignmentTeams)
          .where(
            inArray(
              roleAssignmentTeams.roleAssignmentId,
              rows.map((row) => row.id)
            )
          );
  const teamIdsByJob = new Map<string, string[]>();
  for (const link of links) {
    teamIdsByJob.set(link.roleAssignmentId, [
      ...(teamIdsByJob.get(link.roleAssignmentId) ?? []),
      link.teamId,
    ]);
  }
  return rows.map((row) => ({
    ...row,
    teamIds: teamIdsByJob.get(row.id) ?? [],
  }));
};

export interface GrantInput {
  grantedBy: string;
  role: RoleAssignmentRole;
  scope: RoleAssignmentScope;
  teamIds: string[];
  userId: string;
}

/**
 * Gives a club member a job. A team-scoped job must name at least one team of
 * this club, and only coaching, team and volunteer jobs can be team-scoped.
 */
export const grantRole = async (
  db: Database,
  organizationId: string,
  input: GrantInput
) => {
  const [membership] = await db
    .select({ id: members.id })
    .from(members)
    .where(
      and(
        eq(members.organizationId, organizationId),
        eq(members.userId, input.userId)
      )
    );
  if (membership === undefined) {
    throw notFound("Member");
  }
  if (input.scope === "teams") {
    if (!isTeamScopedRole(input.role)) {
      throw invalid("That job applies to the whole club, not to teams");
    }
    if (input.teamIds.length === 0) {
      throw invalid("Choose at least one team");
    }
    const found = await db
      .select({ id: teams.id })
      .from(teams)
      .where(
        and(
          eq(teams.organizationId, organizationId),
          inArray(teams.id, input.teamIds)
        )
      );
    if (found.length !== new Set(input.teamIds).size) {
      throw notFound("Team");
    }
  }
  try {
    return await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(roleAssignments)
        .values({
          grantedBy: input.grantedBy,
          organizationId,
          role: input.role,
          scope: input.scope,
          userId: input.userId,
        })
        .returning();
      if (created === undefined) {
        throw new Error("Role insert returned no row");
      }
      const teamIds =
        input.scope === "teams" ? [...new Set(input.teamIds)] : [];
      if (teamIds.length > 0) {
        await tx.insert(roleAssignmentTeams).values(
          teamIds.map((teamId) => ({
            organizationId,
            roleAssignmentId: created.id,
            teamId,
          }))
        );
      }
      return { ...created, teamIds };
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflict("They already hold that job");
    }
    throw error;
  }
};

/** Ends a job today. The row stays, so there is a record of who held it and when. */
export const endRole = async (
  db: Database,
  organizationId: string,
  id: string
) => {
  const [row] = await db
    .update(roleAssignments)
    .set({ endsAt: new Date() })
    .where(
      and(
        eq(roleAssignments.organizationId, organizationId),
        eq(roleAssignments.id, id),
        isNull(roleAssignments.endsAt)
      )
    )
    .returning();
  if (row === undefined) {
    throw notFound("Active job");
  }
  const links = await db
    .select()
    .from(roleAssignmentTeams)
    .where(eq(roleAssignmentTeams.roleAssignmentId, id));
  return { ...row, teamIds: links.map((link) => link.teamId) };
};
