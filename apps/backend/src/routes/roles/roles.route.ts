import { ROLE_ASSIGNMENT_ROLES, ROLE_ASSIGNMENT_SCOPES } from "@alice/database";
import { roleAssignmentSelectSchema } from "@alice/database/validation";
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import {
  errorBody,
  idParams,
  invalidBody,
  notFoundBody,
  sessionErrors,
} from "@/lib/route-kit";

const TAGS = ["Roles"];

const memberSchema = z.object({
  email: z.string(),
  joinedAt: z.date(),
  memberId: z.uuid(),
  name: z.string(),
  role: z
    .string()
    .describe("The login role in the club: owner, admin or member."),
  userId: z.uuid(),
});

const jobSchema = roleAssignmentSelectSchema.extend({
  teamIds: z
    .array(z.uuid())
    .describe("The teams the job is limited to. Empty for a club-wide job."),
});

const grantBody = z.object({
  role: z.enum(ROLE_ASSIGNMENT_ROLES).describe("The job to give."),
  scope: z
    .enum(ROLE_ASSIGNMENT_SCOPES)
    .describe("`organization` for the whole club, or `teams` for named teams."),
  teamIds: z
    .array(z.uuid())
    .max(100)
    .default([])
    .describe("Required when the scope is `teams`."),
  userId: z.uuid().describe("The club member who gets the job."),
});

export const listMembers = createRoute({
  description:
    "Everyone with a login to the club and their club role. Owners and admins only.",
  method: "get",
  operationId: "listClubMembers",
  path: "/members",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ members: z.array(memberSchema) }),
      "The club's logins."
    ),
    ...sessionErrors,
  },
  summary: "List club logins",
  tags: TAGS,
});

export const listJobs = createRoute({
  description:
    "Jobs people hold in the club (coach, welfare officer, treasurer and so on). Ended jobs are kept as history and shown with `includeEnded=true`. Owners and admins only.",
  method: "get",
  operationId: "listRoleAssignments",
  path: "/role-assignments",
  request: {
    query: z.object({
      includeEnded: z
        .enum(["true", "false"])
        .default("false")
        .describe("Also return jobs that have ended."),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ roleAssignments: z.array(jobSchema) }),
      "The jobs."
    ),
    ...sessionErrors,
  },
  summary: "List jobs",
  tags: TAGS,
});

export const grantJob = createRoute({
  description:
    "Gives a club member a job. Coaching, team and volunteer jobs can be limited to teams; all other jobs apply to the whole club. Owners and admins only.",
  method: "post",
  operationId: "grantRoleAssignment",
  path: "/role-assignments",
  request: { body: jsonContentRequired(grantBody, "The job and who gets it.") },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(jobSchema, "The new job."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("member or team"),
    [HttpStatusCodes.CONFLICT]: errorBody("They already hold that job."),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Give a job",
  tags: TAGS,
});

export const endJob = createRoute({
  description:
    "Ends a job from now on. The record stays, so the club can show who held it and when. Owners and admins only.",
  method: "post",
  operationId: "endRoleAssignment",
  path: "/role-assignments/{id}/end",
  request: { params: idParams("job") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(jobSchema, "The ended job."),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("active job"),
    ...sessionErrors,
  },
  summary: "End a job",
  tags: TAGS,
});

export type ListMembersRoute = typeof listMembers;
export type ListJobsRoute = typeof listJobs;
export type GrantJobRoute = typeof grantJob;
export type EndJobRoute = typeof endJob;
