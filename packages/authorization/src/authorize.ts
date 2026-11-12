/**
 * Decides whether a caller may take an action on a record.
 *
 * A role says what; its reach says where:
 * - organization: any record in the club
 * - teams: records on the teams the assignment lists
 * - children (guardian): the caller's linked children, plus their teams'
 *   public-ish records such as fixtures
 * - self (player): the caller's own record and their team's fixtures
 *
 * Roles add up. The caller is allowed if any one of their roles allows it
 * within its own reach. Anything missing, unknown, expired or unmatched is a
 * denial.
 *
 * Better Auth only knows the membership role. This is the second layer: team
 * assignments, family links and sensitive-record rules. Hiding a button is
 * not security; call this on the server before touching data.
 */

import type { AccessContext, AccessTarget, LinkedChild } from "./context";
import {
  isAssignableRole,
  isMembershipRole,
  isTeamAssignableRole,
  RESPONSIBILITY_ONLY,
  ROLE_PERMISSIONS,
} from "./policy";
import type { Role } from "./policy";
import type { Action, PermissionMap, Resource } from "./statements";

export type DenyReason =
  | "not_a_member"
  | "wrong_organization"
  | "no_permission"
  | "out_of_scope"
  | "needs_parental_responsibility"
  | "not_assigned"
  | "conflict_of_interest"
  | "locked";

export type Decision =
  | { allowed: true; role: Role }
  | { allowed: false; reason: DenyReason };

export class ForbiddenError extends Error {
  readonly reason: DenyReason;

  constructor(reason: DenyReason, detail: string) {
    super(`Forbidden (${reason}): ${detail}`);
    this.name = "ForbiddenError";
    this.reason = reason;
  }
}

type Reach =
  | { kind: "organization" }
  | { kind: "teams"; teamIds: ReadonlySet<string> }
  | { kind: "children" }
  | { kind: "self" };

interface EffectiveGrant {
  role: Role;
  reach: Reach;
}

/**
 * Records a family member or teammate can see through the team alone. Anything
 * else (medical, finance, attendance, availability...) needs to be about them.
 */
const TEAM_VISIBLE: ReadonlySet<Resource> = new Set([
  "communications",
  "fixtures",
  "squads",
  "teams",
  "training",
]);

/** Actions that only look. A locked record can still be read or reported on. */
const NON_MUTATING_ACTIONS: ReadonlySet<string> = new Set([
  "download",
  "read",
  "read_assigned",
  "read_emergency",
  "read_full",
  "report",
]);

const DENY_PRIORITY: readonly DenyReason[] = [
  "locked",
  "conflict_of_interest",
  "not_assigned",
  "needs_parental_responsibility",
  "out_of_scope",
];

const isActive = (
  grant: { startsAt?: Date; endsAt?: Date | null },
  now: Date
) =>
  (grant.startsAt === undefined || grant.startsAt <= now) &&
  (grant.endsAt === undefined || grant.endsAt === null || grant.endsAt > now);

const parseMemberRoles = (memberRole: string): Role[] => {
  const roles: Role[] = [];
  for (const part of memberRole.split(",")) {
    const name = part.trim();
    if (isMembershipRole(name)) {
      roles.push(name);
    }
  }
  return roles;
};

/** Every role the caller holds right now, with how far each one reaches. */
export const resolveGrants = (
  context: AccessContext,
  now: Date = new Date()
): EffectiveGrant[] => {
  if (context.memberRole === null) {
    return [];
  }

  const organization: Reach = { kind: "organization" };
  // Everyone in the club is a member, even when Better Auth lists only "admin".
  const grants: EffectiveGrant[] = [{ reach: organization, role: "member" }];

  for (const role of parseMemberRoles(context.memberRole)) {
    grants.push({ reach: organization, role });
  }

  for (const assignment of context.assignments) {
    const { role, scope } = assignment;
    if (!isAssignableRole(role) || !isActive(assignment, now)) {
      continue;
    }
    if (scope === "organization") {
      grants.push({ reach: organization, role });
    } else if (isTeamAssignableRole(role)) {
      // A club-wide-only role cannot be limited to teams, so it grants nothing.
      grants.push({
        reach: { kind: "teams", teamIds: new Set(assignment.teamIds) },
        role,
      });
    }
  }

  if (context.linkedChildren.length > 0) {
    grants.push({ reach: { kind: "children" }, role: "guardian" });
  }
  if (context.player !== null) {
    grants.push({ reach: { kind: "self" }, role: "player" });
  }

  return grants;
};

const holds = (role: Role, resource: Resource, action: Action): boolean => {
  const permissions: PermissionMap = ROLE_PERMISSIONS[role];
  const actions: readonly string[] | undefined = permissions[resource];
  return actions?.includes(action) ?? false;
};

const sharesAny = (left: readonly string[], right: ReadonlySet<string>) =>
  left.some((id) => right.has(id));

const childTeamIds = (children: readonly LinkedChild[]) =>
  new Set(children.flatMap((child) => child.teamIds));

type ReachResult = "ok" | "out_of_scope" | "needs_parental_responsibility";

const checkReach = (
  grant: EffectiveGrant,
  context: AccessContext,
  resource: Resource,
  action: string,
  target: AccessTarget
): ReachResult => {
  const { reach } = grant;
  const teamIds = target.teamIds ?? [];

  if (reach.kind === "organization") {
    return "ok";
  }

  if (reach.kind === "teams") {
    return sharesAny(teamIds, reach.teamIds) ? "ok" : "out_of_scope";
  }

  if (reach.kind === "self") {
    if (
      target.subjectPersonId !== undefined &&
      target.subjectPersonId !== null &&
      target.subjectPersonId === context.personId
    ) {
      return "ok";
    }
    const ownTeams = new Set(context.player?.teamIds);
    return TEAM_VISIBLE.has(resource) && sharesAny(teamIds, ownTeams)
      ? "ok"
      : "out_of_scope";
  }

  const child = context.linkedChildren.find(
    (candidate) => candidate.personId === target.subjectPersonId
  );
  if (child !== undefined) {
    const needsResponsibility = RESPONSIBILITY_ONLY.has(
      `${resource}:${action}`
    );
    return needsResponsibility && !child.hasParentalResponsibility
      ? "needs_parental_responsibility"
      : "ok";
  }
  return TEAM_VISIBLE.has(resource) &&
    sharesAny(teamIds, childTeamIds(context.linkedChildren))
    ? "ok"
    : "out_of_scope";
};

/**
 * Rules for the most sensitive records, on top of the matrix and reach. A
 * denial reason, or null when the record is fine to touch.
 */
const checkSensitive = (
  grant: EffectiveGrant,
  context: AccessContext,
  resource: Resource,
  action: string,
  target: AccessTarget
): DenyReason | null => {
  if (resource !== "safeguarding" || action === "report") {
    return null;
  }

  const isAboutCaller =
    target.subjectPersonId !== undefined &&
    target.subjectPersonId !== null &&
    target.subjectPersonId === context.personId;
  if (isAboutCaller) {
    return "conflict_of_interest";
  }

  // The lead sees every case; anyone else only the cases they were put on.
  const isLead = grant.role === "safeguarding_lead";
  if (!isLead && !(target.assignedUserIds ?? []).includes(context.userId)) {
    return "not_assigned";
  }
  return null;
};

const MAY_CHANGE_LOCKED: ReadonlySet<Role> = new Set(["admin", "owner"]);

const checkLocked = (
  grant: EffectiveGrant,
  action: string,
  target: AccessTarget
): DenyReason | null => {
  if (target.locked !== true || NON_MUTATING_ACTIONS.has(action)) {
    return null;
  }
  const mayOverride =
    grant.reach.kind === "organization" && MAY_CHANGE_LOCKED.has(grant.role);
  return mayOverride ? null : "locked";
};

/** Is the caller allowed to take `action` on `resource` for this record. */
export const authorize = <R extends Resource>(
  context: AccessContext,
  resource: R,
  action: Action<R>,
  target: AccessTarget,
  now: Date = new Date()
): Decision => {
  if (context.memberRole === null) {
    return { allowed: false, reason: "not_a_member" };
  }
  // Never trust the record's own claim of where it lives over the caller's club.
  if (target.organizationId !== context.organizationId) {
    return { allowed: false, reason: "wrong_organization" };
  }

  const denials = new Set<DenyReason>();

  for (const grant of resolveGrants(context, now)) {
    if (!holds(grant.role, resource, action)) {
      continue;
    }
    const reach = checkReach(grant, context, resource, action, target);
    const denial =
      reach === "ok"
        ? (checkSensitive(grant, context, resource, action, target) ??
          checkLocked(grant, action, target))
        : reach;
    if (denial === null) {
      return { allowed: true, role: grant.role };
    }
    denials.add(denial);
  }

  const reason = DENY_PRIORITY.find((candidate) => denials.has(candidate));
  return { allowed: false, reason: reason ?? "no_permission" };
};

export const can = <R extends Resource>(
  context: AccessContext,
  resource: R,
  action: Action<R>,
  target: AccessTarget,
  now: Date = new Date()
): boolean => authorize(context, resource, action, target, now).allowed;

/** Like `authorize` but throws, for handlers that just want to stop. */
export const assertCan = <R extends Resource>(
  context: AccessContext,
  resource: R,
  action: Action<R>,
  target: AccessTarget,
  now: Date = new Date()
): Role => {
  const decision = authorize(context, resource, action, target, now);
  if (!decision.allowed) {
    throw new ForbiddenError(decision.reason, `${resource}:${action}`);
  }
  return decision.role;
};

export interface AccessScope {
  /** The caller may do this anywhere in the club. */
  organization: boolean;
  /** Teams the caller may do this on. */
  teamIds: string[];
  /** People whose own records the caller may do this on. */
  personIds: string[];
}

/**
 * Where the caller may take this action, for filtering a list query. This is a
 * coarse filter: per-record rules (locked, assigned cases, conflicts) are
 * checked by `authorize` on each record you return.
 */
export const accessScope = <R extends Resource>(
  context: AccessContext,
  resource: R,
  action: Action<R>,
  now: Date = new Date()
): AccessScope => {
  const teamIds = new Set<string>();
  const personIds = new Set<string>();
  let organization = false;

  for (const { reach, role } of resolveGrants(context, now)) {
    if (!holds(role, resource, action)) {
      continue;
    }
    if (reach.kind === "organization") {
      organization = true;
    } else if (reach.kind === "teams") {
      for (const id of reach.teamIds) {
        teamIds.add(id);
      }
    } else if (reach.kind === "self") {
      if (context.personId !== null) {
        personIds.add(context.personId);
      }
      if (TEAM_VISIBLE.has(resource)) {
        for (const id of context.player?.teamIds ?? []) {
          teamIds.add(id);
        }
      }
    } else {
      const needsResponsibility = RESPONSIBILITY_ONLY.has(
        `${resource}:${action}`
      );
      for (const child of context.linkedChildren) {
        if (!needsResponsibility || child.hasParentalResponsibility) {
          personIds.add(child.personId);
          if (TEAM_VISIBLE.has(resource)) {
            for (const id of child.teamIds) {
              teamIds.add(id);
            }
          }
        }
      }
    }
  }

  return {
    organization,
    personIds: [...personIds],
    teamIds: [...teamIds],
  };
};
