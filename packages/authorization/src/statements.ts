/**
 * The permission vocabulary: every resource the football app protects and the
 * actions that can be taken on it. These are our own names, not Better Auth's.
 * What each role may do lives in `policy.ts`; where it may do it lives in
 * `authorize.ts`.
 */

import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

export const footballStatement = {
  attendance: ["read", "record", "correct"],
  audit: ["read"],
  availability: ["read", "respond", "manage"],
  clubs: ["read", "update", "archive"],
  communications: ["read", "create", "moderate", "delete"],
  consents: ["read", "record", "withdraw"],
  credentials: ["read", "record", "verify"],
  documents: ["read", "upload", "archive", "download"],
  finance: ["read", "create", "update", "refund", "export"],
  fixtures: ["read", "create", "update", "cancel", "publish"],
  guardians: ["read", "create", "update", "verify"],
  incidents: ["read", "record"],
  medical: ["read_emergency", "read_full", "update"],
  players: ["read", "create", "update", "archive"],
  registrations: ["read", "create", "review", "approve", "reject"],
  roles: ["read", "assign", "revoke"],
  safeguarding: ["report", "read_assigned", "manage", "close"],
  seasons: ["read", "create", "update", "archive"],
  squads: ["read", "select", "publish"],
  teams: ["read", "create", "update", "archive"],
  training: ["read", "create", "update", "cancel"],
  venues: ["read", "create", "update", "archive"],
} as const;

/** Better Auth's organization resources plus ours, so its defaults keep working. */
export const statement = {
  ...defaultStatements,
  ...footballStatement,
} as const;

export const ac = createAccessControl(statement);

export type FootballStatement = typeof footballStatement;
export type Resource = keyof FootballStatement;
export type Action<R extends Resource = Resource> =
  FootballStatement[R][number];

/** Actions a role holds, per resource. A resource that is absent is denied. */
export type PermissionMap = { [R in Resource]?: Action<R>[] };
