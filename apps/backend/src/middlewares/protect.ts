/* oxlint-disable node/callback-return -- Hono middleware ends by awaiting next(); the Node callback rule does not apply. */
import type { MiddlewareHandler } from "hono";
import { bodyLimit } from "hono/body-limit";
import { compress } from "hono/compress";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { isShuttingDown } from "@/lib/lifecycle";
import type { AppBindings } from "@/types";

/** Standard security headers. "same-site" lets our own web apps read API responses. */
export const securityHeaders = (): MiddlewareHandler =>
  secureHeaders({ crossOriginResourcePolicy: "same-site" });

/** Tells clients to drop their connection once shutdown has started. */
export const closeWhenShuttingDown =
  (): MiddlewareHandler => async (c, next) => {
    await next();
    if (isShuttingDown()) {
      c.header("Connection", "close");
    }
  };

/** Rejects a body over `maxBytes` with a 413 before it is read into memory. */
export const limitBody = (maxBytes: number): MiddlewareHandler =>
  bodyLimit({
    maxSize: maxBytes,
    onError: (c) =>
      c.json(
        { message: "Payload too large" },
        HttpStatusCodes.REQUEST_TOO_LONG
      ),
  });

/** Answers 504 when a request runs longer than `timeoutMs`. */
export const limitDuration = (timeoutMs: number): MiddlewareHandler =>
  timeout(
    timeoutMs,
    () =>
      new HTTPException(HttpStatusCodes.GATEWAY_TIMEOUT, {
        res: Response.json(
          { message: "Request timed out" },
          { status: HttpStatusCodes.GATEWAY_TIMEOUT }
        ),
      })
  );

/** Gzips JSON responses over 1 KiB when the client accepts it. */
export const compressResponses = (): MiddlewareHandler => compress();

/**
 * API responses are private to the signed-in user, so shared caches must not
 * keep them. A route that sets its own Cache-Control keeps it.
 */
export const noStore = (): MiddlewareHandler => async (c, next) => {
  await next();
  if (!c.res.headers.has("Cache-Control")) {
    c.header("Cache-Control", "no-store");
  }
};

/** Logs a warning for any request slower than `thresholdMs`. */
export const logSlowRequests =
  (thresholdMs: number): MiddlewareHandler<AppBindings> =>
  async (c, next) => {
    const started = performance.now();
    await next();
    const durationMs = Math.round(performance.now() - started);
    if (durationMs >= thresholdMs) {
      c.get("logger").warn(
        { durationMs, method: c.req.method, path: c.req.path },
        "Slow request"
      );
    }
  };
