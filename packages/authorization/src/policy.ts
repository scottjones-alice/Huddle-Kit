/**
 * What each role may do, as data. One place to read and change the matrix.
 *
 * Rules the matrix follows:
 * - Nothing is implied. `manage` is not a shortcut, and `read_full` does not
 *   include `read_emergency`: each role lists exactly the actions it holds.
 * - Owners and admins run the club but get no safeguarding case access and no
 *   full medical records. Those need a role that is given on purpose.
 * - Roles are additive. A person who is treasurer and an U10s coach holds both
 *   sets, each within its own reach (see `authorize.ts`).
 */

import type { PermissionMap } from "./statements";

/** Roles Better Auth stores on `members.role`. */
export const MEMBERSHIP_ROLES = ["owner", "admin", "member"] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

/** Roles given through `role_assignments` that are always club-wide. */
export const ORG_ASSIGNABLE_ROLES = [
  "admin",
  "secretary",
  "treasurer",
  "safeguarding_lead",
  "safeguarding_deputy",
  "welfare_officer",
] as const;

/** Roles given through `role_assignments` that can be limited to teams. */
export const TEAM_ASSIGNABLE_ROLES = [
  "head_coach",
  "coach",
  "assistant_coach",
  "team_manager",
  "first_aider",
  "volunteer",
] as const;
export type OrgAssignableRole = (typeof ORG_ASSIGNABLE_ROLES)[number];
export type TeamAssignableRole = (typeof TEAM_ASSIGNABLE_ROLES)[number];

/** Roles that come from a relationship, never from an assignment. */
export const RELATIONSHIP_ROLES = ["guardian", "player"] as const;
export type RelationshipRole = (typeof RELATIONSHIP_ROLES)[number];

export type Role =
  | MembershipRole
  | OrgAssignableRole
  | TeamAssignableRole
  | RelationshipRole;

const ADMINISTRATION: PermissionMap = {
  attendance: ["read", "record", "correct"],
  audit: ["read"],
  availability: ["read", "respond", "manage"],
  communications: ["read", "create", "moderate", "delete"],
  consents: ["read", "record", "withdraw"],
  credentials: ["read"],
  documents: ["read", "upload", "archive", "download"],
  fixtures: ["read", "create", "update", "cancel", "publish"],
  guardians: ["read", "create", "update", "verify"],
  incidents: ["read", "record"],
  medical: ["read_emergency"],
  players: ["read", "create", "update", "archive"],
  registrations: ["read", "create", "review", "approve", "reject"],
  roles: ["read", "assign", "revoke"],
  safeguarding: ["report"],
  seasons: ["read", "create", "update", "archive"],
  squads: ["read", "select", "publish"],
  teams: ["read", "create", "update", "archive"],
  training: ["read", "create", "update", "cancel"],
  venues: ["read", "create", "update", "archive"],
};

export const ROLE_PERMISSIONS = {
  admin: {
    ...ADMINISTRATION,
    clubs: ["read", "update"],
    finance: ["read"],
  },
  assistant_coach: {
    attendance: ["read", "record"],
    availability: ["read"],
    fixtures: ["read"],
    incidents: ["record"],
    medical: ["read_emergency"],
    players: ["read"],
    safeguarding: ["report"],
    squads: ["read"],
    teams: ["read"],
    training: ["read", "update"],
  },
  coach: {
    attendance: ["read", "record"],
    availability: ["read", "manage"],
    communications: ["read", "create"],
    consents: ["read"],
    fixtures: ["read", "create", "update"],
    incidents: ["read", "record"],
    medical: ["read_emergency"],
    players: ["read"],
    safeguarding: ["report"],
    squads: ["read", "select"],
    teams: ["read"],
    training: ["read", "create", "update", "cancel"],
  },
  first_aider: {
    incidents: ["read", "record"],
    medical: ["read_emergency"],
    players: ["read"],
    safeguarding: ["report"],
  },
  guardian: {
    attendance: ["read"],
    availability: ["read", "respond"],
    communications: ["read"],
    consents: ["read", "record", "withdraw"],
    documents: ["read", "upload", "download"],
    finance: ["read", "create"],
    fixtures: ["read"],
    guardians: ["read", "update"],
    medical: ["read_full", "read_emergency", "update"],
    players: ["read", "update"],
    registrations: ["read", "create"],
    safeguarding: ["report"],
    squads: ["read"],
    teams: ["read"],
    training: ["read"],
  },
  head_coach: {
    attendance: ["read", "record", "correct"],
    availability: ["read", "respond", "manage"],
    communications: ["read", "create"],
    consents: ["read"],
    documents: ["read", "upload", "download"],
    fixtures: ["read", "create", "update", "cancel", "publish"],
    guardians: ["read"],
    incidents: ["read", "record"],
    medical: ["read_emergency"],
    players: ["read", "create", "update"],
    safeguarding: ["report"],
    squads: ["read", "select", "publish"],
    teams: ["read"],
    training: ["read", "create", "update", "cancel"],
  },
  member: {
    clubs: ["read"],
    fixtures: ["read"],
    safeguarding: ["report"],
    teams: ["read"],
    training: ["read"],
    venues: ["read"],
  },
  owner: {
    ...ADMINISTRATION,
    clubs: ["read", "update", "archive"],
    finance: ["read", "create", "update", "refund", "export"],
  },
  player: {
    attendance: ["read"],
    availability: ["read", "respond"],
    communications: ["read"],
    consents: ["read"],
    documents: ["read"],
    fixtures: ["read"],
    medical: ["read_full", "read_emergency"],
    players: ["read", "update"],
    safeguarding: ["report"],
    squads: ["read"],
    teams: ["read"],
    training: ["read"],
  },
  safeguarding_deputy: {
    clubs: ["read"],
    consents: ["read"],
    credentials: ["read"],
    documents: ["read"],
    guardians: ["read"],
    incidents: ["read", "record"],
    medical: ["read_emergency"],
    players: ["read"],
    safeguarding: ["report", "read_assigned"],
    teams: ["read"],
  },
  safeguarding_lead: {
    clubs: ["read"],
    communications: ["read"],
    consents: ["read"],
    credentials: ["read", "record", "verify"],
    documents: ["read"],
    guardians: ["read"],
    incidents: ["read", "record"],
    medical: ["read_emergency"],
    players: ["read"],
    safeguarding: ["report", "read_assigned", "manage", "close"],
    teams: ["read"],
  },
  secretary: {
    clubs: ["read"],
    communications: ["read", "create", "moderate"],
    consents: ["read", "record", "withdraw"],
    documents: ["read", "upload", "archive", "download"],
    fixtures: ["read", "create", "update", "cancel", "publish"],
    guardians: ["read", "create", "update", "verify"],
    players: ["read", "create", "update"],
    registrations: ["read", "create", "review", "approve", "reject"],
    roles: ["read"],
    safeguarding: ["report"],
    seasons: ["read", "create", "update"],
    teams: ["read"],
    training: ["read"],
    venues: ["read", "create", "update", "archive"],
  },
  team_manager: {
    attendance: ["read"],
    availability: ["read", "respond", "manage"],
    communications: ["read", "create"],
    consents: ["read"],
    documents: ["read"],
    fixtures: ["read", "create", "update"],
    guardians: ["read"],
    incidents: ["record"],
    players: ["read"],
    safeguarding: ["report"],
    squads: ["read"],
    teams: ["read"],
    training: ["read", "create", "update"],
  },
  treasurer: {
    clubs: ["read"],
    communications: ["read", "create"],
    documents: ["read", "download"],
    finance: ["read", "create", "update", "refund", "export"],
    guardians: ["read"],
    players: ["read"],
    registrations: ["read"],
    safeguarding: ["report"],
    teams: ["read"],
  },
  volunteer: {
    fixtures: ["read"],
    safeguarding: ["report"],
    teams: ["read"],
    training: ["read"],
  },
  welfare_officer: {
    consents: ["read"],
    credentials: ["read"],
    incidents: ["read", "record"],
    medical: ["read_emergency"],
    players: ["read"],
    safeguarding: ["report"],
    teams: ["read"],
  },
} as const satisfies Record<Role, PermissionMap>;

const KNOWN_ROLES = new Set<string>(Object.keys(ROLE_PERMISSIONS));
const ORG_ASSIGNABLE = new Set<string>(ORG_ASSIGNABLE_ROLES);
const TEAM_ASSIGNABLE = new Set<string>(TEAM_ASSIGNABLE_ROLES);
const MEMBERSHIP = new Set<string>(MEMBERSHIP_ROLES);

export const isRole = (value: string): value is Role => KNOWN_ROLES.has(value);

export const isMembershipRole = (value: string): value is MembershipRole =>
  MEMBERSHIP.has(value);

/** Can this role be handed out through `role_assignments` at all. */
export const isAssignableRole = (
  value: string
): value is OrgAssignableRole | TeamAssignableRole =>
  ORG_ASSIGNABLE.has(value) || TEAM_ASSIGNABLE.has(value);

/** Can this role be limited to specific teams. Org-only roles cannot. */
export const isTeamAssignableRole = (
  value: string
): value is TeamAssignableRole => TEAM_ASSIGNABLE.has(value);

/**
 * Actions that need parental responsibility, not just a family link. A
 * grandparent who collects the child can see the fixtures but cannot consent
 * to medical treatment or sign the child up.
 */
export const RESPONSIBILITY_ONLY: ReadonlySet<string> = new Set([
  "consents:record",
  "consents:withdraw",
  "finance:create",
  "guardians:update",
  "medical:read_full",
  "medical:update",
  "players:update",
  "registrations:create",
]);
