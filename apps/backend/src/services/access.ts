import { members, roleAssignmentTeams, roleAssignments } from "@alice/database";
import type { Database, RoleAssignmentRole } from "@alice/database";
import { and, eq, gt, inArray, isNull, or } from "drizzle-orm";

import { forbidden } from "@/lib/app-error";

/** Who is calling, and what that lets them do in the active club. */
export interface Caller {
  /** A coaching job that covers every team. */
  clubWideCoaching: boolean;
  /** True for the club's owners and admins, and people holding the admin or secretary job. */
  isManager: boolean;
  /** Jobs they hold right now (coach, welfare officer, and so on). */
  jobs: ReadonlySet<RoleAssignmentRole>;
  /** Better Auth roles in this club (owner, admin, member). */
  memberRoles: ReadonlySet<string>;
  organizationId: string;
  /** Teams a team-limited coaching job covers. Empty when none are limited. */
  scopedTeamIds: ReadonlySet<string>;
  userId: string;
}

const MANAGER_MEMBER_ROLES: ReadonlySet<string> = new Set(["owner", "admin"]);
const MANAGER_JOBS: ReadonlySet<RoleAssignmentRole> = new Set([
  "admin",
  "secretary",
]);
const MONEY_JOBS: ReadonlySet<RoleAssignmentRole> = new Set(["treasurer"]);
const SAFEGUARDING_JOBS: ReadonlySet<RoleAssignmentRole> = new Set([
  "welfare_officer",
  "safeguarding_lead",
  "safeguarding_deputy",
]);
const COACHING_JOBS: ReadonlySet<RoleAssignmentRole> = new Set([
  "head_coach",
  "coach",
  "assistant_coach",
  "team_manager",
]);

const hasAny = <T>(held: ReadonlySet<T>, wanted: ReadonlySet<T>): boolean =>
  [...wanted].some((item) => held.has(item));

/**
 * Loads the caller's standing in the club. A signed-in user who is not a member
 * of the club (for example removed while their session was still open) gets 403.
 */
export const loadCaller = async (
  db: Database,
  { organizationId, userId }: { organizationId: string; userId: string }
): Promise<Caller> => {
  const [memberRows, jobRows] = await Promise.all([
    db
      .select({ role: members.role })
      .from(members)
      .where(
        and(
          eq(members.organizationId, organizationId),
          eq(members.userId, userId)
        )
      ),
    db
      .select({
        id: roleAssignments.id,
        role: roleAssignments.role,
        scope: roleAssignments.scope,
      })
      .from(roleAssignments)
      .where(
        and(
          eq(roleAssignments.organizationId, organizationId),
          eq(roleAssignments.userId, userId),
          or(
            isNull(roleAssignments.endsAt),
            gt(roleAssignments.endsAt, new Date())
          )
        )
      ),
  ]);
  if (memberRows.length === 0) {
    throw forbidden("You are not a member of this club");
  }
  const memberRoles = new Set(
    memberRows.flatMap((row) => row.role.split(",").map((r) => r.trim()))
  );
  const jobs = new Set(jobRows.map((row) => row.role));
  const limitedIds: string[] = [];
  for (const row of jobRows) {
    if (row.scope === "teams" && COACHING_JOBS.has(row.role)) {
      limitedIds.push(row.id);
    }
  }
  const links =
    limitedIds.length === 0
      ? []
      : await db
          .select({ teamId: roleAssignmentTeams.teamId })
          .from(roleAssignmentTeams)
          .where(inArray(roleAssignmentTeams.roleAssignmentId, limitedIds));
  return {
    clubWideCoaching: jobRows.some(
      (row) => row.scope === "organization" && COACHING_JOBS.has(row.role)
    ),
    isManager:
      hasAny(memberRoles, MANAGER_MEMBER_ROLES) || hasAny(jobs, MANAGER_JOBS),
    jobs,
    memberRoles,
    organizationId,
    scopedTeamIds: new Set(links.map((link) => link.teamId)),
    userId,
  };
};

export const requireManager = (caller: Caller): void => {
  if (!caller.isManager) {
    throw forbidden("Only a club owner or admin can do this");
  }
};

/** Managers, plus the treasurer, who looks after the club's money. */
export const canManageMoney = (caller: Caller): boolean =>
  caller.isManager || hasAny(caller.jobs, MONEY_JOBS);

export const requireMoneyAccess = (caller: Caller): void => {
  if (!canManageMoney(caller)) {
    throw forbidden("Only a club admin or the treasurer can do this");
  }
};

/** Welfare officers, safeguarding leads and deputies, and the club owner. */
export const canSeeSafeguarding = (caller: Caller): boolean =>
  caller.memberRoles.has("owner") || hasAny(caller.jobs, SAFEGUARDING_JOBS);

export const requireSafeguardingAccess = (caller: Caller): void => {
  if (!canSeeSafeguarding(caller)) {
    throw forbidden("Only the club's safeguarding team can do this");
  }
};

/** Managers and anyone holding a coaching job. */
export const isCoachOrManager = (caller: Caller): boolean =>
  caller.isManager || hasAny(caller.jobs, COACHING_JOBS);

/**
 * Managers, anyone with a club-wide coaching job, and coaches whose job names
 * this team. A coach limited to other teams cannot change this one.
 */
export const canCoachTeam = (caller: Caller, teamId: string): boolean =>
  caller.isManager ||
  caller.clubWideCoaching ||
  caller.scopedTeamIds.has(teamId);
