import * as HttpStatusCodes from "stoker/http-status-codes";

import { callerOf } from "@/lib/caller";
import { isTrue } from "@/lib/schemas";
import { requireManager } from "@/services/access";
import { db } from "@/services/database";
import {
  endRole,
  grantRole,
  listClubMembers,
  listRoleAssignments,
} from "@/services/roles";
import type { AuthedRouteHandler } from "@/types";

import type {
  EndJobRoute,
  GrantJobRoute,
  ListJobsRoute,
  ListMembersRoute,
} from "./roles.route";

export const listMembers: AuthedRouteHandler<ListMembersRoute> = async (c) => {
  requireManager(await callerOf(c));
  const rows = await listClubMembers(db, c.get("organizationId"));
  return c.json({ members: rows }, HttpStatusCodes.OK);
};

export const listJobs: AuthedRouteHandler<ListJobsRoute> = async (c) => {
  requireManager(await callerOf(c));
  const { includeEnded } = c.req.valid("query");
  const rows = await listRoleAssignments(
    db,
    c.get("organizationId"),
    isTrue(includeEnded)
  );
  return c.json({ roleAssignments: rows }, HttpStatusCodes.OK);
};

export const grantJob: AuthedRouteHandler<GrantJobRoute> = async (c) => {
  requireManager(await callerOf(c));
  const job = await grantRole(db, c.get("organizationId"), {
    ...c.req.valid("json"),
    grantedBy: c.get("userId"),
  });
  return c.json(job, HttpStatusCodes.CREATED);
};

export const endJob: AuthedRouteHandler<EndJobRoute> = async (c) => {
  requireManager(await callerOf(c));
  const { id } = c.req.valid("param");
  return c.json(
    await endRole(db, c.get("organizationId"), id),
    HttpStatusCodes.OK
  );
};
