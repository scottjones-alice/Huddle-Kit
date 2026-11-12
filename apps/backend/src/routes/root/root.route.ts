import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";

const checkResultSchema = z.object({
  error: z.enum(["timeout", "unavailable"]).optional(),
  latencyMs: z.number().int().nonnegative().optional(),
  status: z.enum(["up", "down", "not_configured"]),
});

export const healthSchema = z.object({
  checks: z.record(z.string(), checkResultSchema),
  name: z.string(),
  status: z.enum(["ok", "degraded", "unhealthy"]),
  timestamp: z.string(),
  uptimeSeconds: z.number().int().nonnegative(),
  version: z.string(),
});

export const rootRoute = createRoute({
  description:
    "Checks every dependency (database, storage, email, worker, novu). Responds 503 when a critical one is down.",
  method: "get",
  operationId: "getApiRoot",
  path: "/",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      healthSchema,
      "The API is up. Status is ok or degraded."
    ),
    [HttpStatusCodes.SERVICE_UNAVAILABLE]: jsonContent(
      healthSchema,
      "A critical dependency is down."
    ),
  },
  // Public: overrides the global session-cookie requirement in the OpenAPI doc.
  security: [],
  summary: "Health",
  tags: ["Health"],
});

export type RootRoute = typeof rootRoute;
