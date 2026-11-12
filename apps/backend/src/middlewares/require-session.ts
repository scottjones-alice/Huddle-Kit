import type { MiddlewareHandler } from "hono";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AuthedBindings } from "@/types";

export interface SessionInfo {
  user: { id: string };
  session: { activeOrganizationId?: string | null };
}

/** Reads the session from request headers. Better Auth provides the real one. */
export type GetSession = (headers: Headers) => Promise<SessionInfo | null>;

/**
 * Requires a signed-in user with an active organization, and puts both on the
 * request. Routes read `userId` and `organizationId` from here, never from the
 * request body, so a caller can't act as someone else or in another organization.
 */
export function requireSession(
  getSession: GetSession
): MiddlewareHandler<AuthedBindings> {
  // oxlint-disable-next-line typescript/consistent-return
  return async (c, next) => {
    const result = await getSession(c.req.raw.headers);

    if (result === null) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    const organizationId = result.session.activeOrganizationId;

    if (organizationId === null || organizationId === undefined) {
      return c.json(
        { message: "No active organization" },
        HttpStatusCodes.FORBIDDEN
      );
    }

    c.set("userId", result.user.id);
    c.set("organizationId", organizationId);
    // Hono middleware ends by awaiting next(); the Node callback rule does not apply.
    // oxlint-disable-next-line node/callback-return
    await next();
  };
}
