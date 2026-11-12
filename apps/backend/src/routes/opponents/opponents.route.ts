import {
  opponentInsertSchema,
  opponentSelectSchema,
} from "@alice/database/validation";
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import {
  errorBody,
  idParams,
  includeArchivedQuery,
  invalidBody,
  notFoundBody,
  sessionErrors,
} from "@/lib/route-kit";

const TAGS = ["Opponents"];

const opponentBody = opponentInsertSchema.pick({
  contactEmail: true,
  contactPhone: true,
  homeVenueId: true,
  name: true,
  shortName: true,
  website: true,
});

const opponentChanges = opponentBody.partial().extend({
  isActive: z
    .boolean()
    .optional()
    .describe("false archives the opponent, true brings it back."),
});

export const listOpponents = createRoute({
  description: "Clubs the team plays against, A to Z.",
  method: "get",
  operationId: "listOpponents",
  path: "/opponents",
  request: { query: includeArchivedQuery },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ opponents: z.array(opponentSelectSchema) }),
      "The opponents."
    ),
    ...sessionErrors,
  },
  summary: "List opponents",
  tags: TAGS,
});

export const createOpponent = createRoute({
  description:
    "Adds an opposition club. Owners, admins and anyone with a coaching job can do this.",
  method: "post",
  operationId: "createOpponent",
  path: "/opponents",
  request: { body: jsonContentRequired(opponentBody, "The opponent.") },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      opponentSelectSchema,
      "The new opponent."
    ),
    [HttpStatusCodes.CONFLICT]: errorBody("That opponent is already listed."),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Add an opponent",
  tags: TAGS,
});

export const updateOpponent = createRoute({
  description:
    "Changes an opponent, or archives it with `isActive: false`. Past fixtures keep pointing at it.",
  method: "patch",
  operationId: "updateOpponent",
  path: "/opponents/{id}",
  request: {
    body: jsonContentRequired(opponentChanges, "The fields to change."),
    params: idParams("opponent"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      opponentSelectSchema,
      "The updated opponent."
    ),
    [HttpStatusCodes.NOT_FOUND]: notFoundBody("opponent"),
    [HttpStatusCodes.CONFLICT]: errorBody("That opponent is already listed."),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: invalidBody,
    ...sessionErrors,
  },
  summary: "Change or archive an opponent",
  tags: TAGS,
});

export type ListOpponentsRoute = typeof listOpponents;
export type CreateOpponentRoute = typeof createOpponent;
export type UpdateOpponentRoute = typeof updateOpponent;
