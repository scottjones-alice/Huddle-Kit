import type { MiddlewareHandler } from "hono";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { SignedInUser } from "@/services/membership";
import type { UserBindings } from "@/types";

/** Reads the session from request headers. Better Auth provides the real one. */
export type GetUser = (headers: Headers) => Promise<{
  user: { email: string; emailVerified: boolean; id: string };
} | null>;

/**
 * Requires a signed-in user and nothing more: they need not belong to a club
 * yet. Used by the routes that create or join one. Routes read the user from
 * here, never from the request body.
 */
export function requireUser(getUser: GetUser): MiddlewareHandler<UserBindings> {
  // oxlint-disable-next-line typescript/consistent-return
  return async (c, next) => {
    const result = await getUser(c.req.raw.headers);

    if (result === null) {
      return c.json({ message: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
    }

    const user: SignedInUser = {
      email: result.user.email,
      emailVerified: result.user.emailVerified,
      id: result.user.id,
    };
    c.set("user", user);
    // Hono middleware ends by awaiting next(); the Node callback rule does not apply.
    // oxlint-disable-next-line node/callback-return
    await next();
  };
}
