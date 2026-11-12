/**
 * The roles Better Auth itself knows about: owner, admin and member. They are
 * built from the same matrix as everything else, so the plugin and our own
 * checks cannot disagree. Football jobs (coach, treasurer...) are not Better
 * Auth roles; they come from `role_assignments`.
 *
 * Pass `{ ac, roles: organizationRoles }` to the organization plugin.
 */

import {
  adminAc,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

import { ROLE_PERMISSIONS } from "./policy";
import { ac } from "./statements";

export const organizationRoles = {
  admin: ac.newRole({ ...adminAc.statements, ...ROLE_PERMISSIONS.admin }),
  member: ac.newRole({ ...memberAc.statements, ...ROLE_PERMISSIONS.member }),
  owner: ac.newRole({ ...ownerAc.statements, ...ROLE_PERMISSIONS.owner }),
};
