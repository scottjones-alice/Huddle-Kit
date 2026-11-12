import { z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";

/**
 * Pieces every route file repeats: the error body, and the responses that any
 * route behind the session middleware can give.
 */
export const errorSchema = z.object({ message: z.string() });

export const errorBody = (description: string) =>
  jsonContent(errorSchema, description);

/** 401 and 403 from the session middleware, for the API docs. */
export const sessionErrors = {
  [HttpStatusCodes.UNAUTHORIZED]: errorBody("No signed-in user."),
  [HttpStatusCodes.FORBIDDEN]: errorBody(
    "No active club, or the caller may not do this."
  ),
} as const;

export const notFoundBody = (what: string) =>
  errorBody(`No such ${what}, or it belongs to another club.`);

export const invalidBody = errorBody("Some fields are not valid.");

/** A `{id}` path parameter that is a UUID, described for the API docs. */
export const idParams = (what: string) =>
  z.object({ id: z.uuid().describe(`The ${what}'s id.`) });

/** Page controls for list routes. */
export const pageQuery = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(200)
    .default(50)
    .describe("How many to return (1 to 200)."),
  offset: z.coerce
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("How many to skip."),
});

export const includeArchivedQuery = z.object({
  includeArchived: z
    .enum(["true", "false"])
    .default("false")
    .describe("Also return archived records."),
});
