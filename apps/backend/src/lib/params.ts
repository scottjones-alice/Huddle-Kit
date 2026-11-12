import { z } from "@hono/zod-openapi";

/** A `{id}` path parameter that is a UUID, described for the API docs. */
export const idParam = (what: string) =>
  z.object({
    id: z.uuid().describe(`The ${what}'s id.`),
  });
