import { REGISTRATION_STATUSES } from "@alice/database";
import { registrationSelectSchema } from "@alice/database/validation";
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import {
  errorBody,
  idParams,
  invalidBody,
  notFoundBody,
  pageQuery,
  sessionErrors,
} from "@/lib/route-kit";

const TAGS = ["Registrations"];

const listQuery = pageQuery.extend({
  personId: z.uuid().optional().describe("Only this person."),
  seasonId: z.uuid().optional().describe("Only this season."),
  status: z
    .enum(REGISTRATION_STATUSES)
    .optional()
    .describe("Only this status."),
  teamId: z.uuid().optional().describe("Only this team."),
});

const registerBody = z.object({
  notes: z.string().trim().max(1000).nullish(),
  personId: z.uuid().describe("Yourself or your child."),
  seasonId: z.uuid(),
  teamId: z
    .uuid()
    .nullish()
    .describe("Club admins only: the team to place them in."),
});

const changes = z.object({
  notes: z.string().trim().max(1000).nullish(),
  status: z
    .enum(["active", "rejected", "withdrawn"])
    .optional()
    .describe(
      "Admins can accept, reject or withdraw. The person or their parent can only withdraw."
    ),
  teamId: z.uuid().nullish().describe("Club admins only."),
});

export const listRegistrations = createRoute({
  description:
    "Club admins see everyone's registrations. Everyone else sees their own and their children's.",
  method: "get",
  operationId: "listRegistrations",
  path: "/registrations",
  request: { query: listQuery },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ registrations: z.array(registrationSelectSchema) }),
      "The registrations, newest first."
    ),
    ...sessionErrors,
  },
  summary: "List registrations",
  tags: TAGS,
});

export const register = createRoute({
  description:
    "Asks to join for a season. It waits as pending for a club admin to accept; if a club admin registers someone it starts active. Each person can register once per season.",
  method: "post",
  operationId: "register",
  path: "/registrations",
  request: { body: jsonContentRequired(registerBody, "Who and which season.") },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      registrationSelectSchema,
      "The registration."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("person, season or team"),
    [HttpStatusCodes.CONFLICT]: errorBody(
      "Already registered for that season."
    ),
    ...sessionErrors,
  },
  summary: "Register for a season",
  tags: TAGS,
});

export const updateRegistration = createRoute({
  description:
    "Accepts, rejects, places or withdraws a registration. It is never deleted, so the history stays.",
  method: "patch",
  operationId: "updateRegistration",
  path: "/registrations/{id}",
  request: {
    body: jsonContentRequired(changes, "The fields to change."),
    params: idParams("registration"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      registrationSelectSchema,
      "The updated registration."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("registration"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Change or withdraw a registration",
  tags: TAGS,
});

export type ListRegistrationsRoute = typeof listRegistrations;
export type RegisterRoute = typeof register;
export type UpdateRegistrationRoute = typeof updateRegistration;
