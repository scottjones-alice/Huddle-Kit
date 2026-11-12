/** Public entry point for @alice/authorization. */

export {
  accessScope,
  assertCan,
  authorize,
  can,
  ForbiddenError,
  resolveGrants,
} from "./authorize";

export type { AccessScope, Decision, DenyReason } from "./authorize";

export type {
  AccessContext,
  AccessTarget,
  LinkedChild,
  RoleGrant,
} from "./context";

export { loadAccessContext } from "./load-access-context";

export type { LoadAccessContextOptions } from "./load-access-context";

export { organizationRoles } from "./organization-roles";

export {
  isAssignableRole,
  isRole,
  isTeamAssignableRole,
  MEMBERSHIP_ROLES,
  ORG_ASSIGNABLE_ROLES,
  RELATIONSHIP_ROLES,
  ROLE_PERMISSIONS,
  TEAM_ASSIGNABLE_ROLES,
} from "./policy";

export type { Role } from "./policy";

export { ac, footballStatement, statement } from "./statements";

export type { Action, PermissionMap, Resource } from "./statements";
