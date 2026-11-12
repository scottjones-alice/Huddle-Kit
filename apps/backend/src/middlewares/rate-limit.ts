/* oxlint-disable node/callback-return -- Hono middleware ends by awaiting next(); the Node callback rule does not apply. */
import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context, MiddlewareHandler } from "hono";
import * as HttpStatusCodes from "stoker/http-status-codes";

const MS_PER_SECOND = 1000;
const MAX_TRACKED_CLIENTS = 100_000;
const UNKNOWN_CLIENT = "unknown";

export interface RateLimitOptions {
  /** Reads the client address. Defaults to the socket, or X-Forwarded-For with trustProxy. */
  getAddress?: (c: Context) => string | undefined;
  max: number;
  now?: () => number;
  /** Requests for which no limit applies, e.g. the health check. */
  skip?: (c: Context) => boolean;
  /** Trust the last X-Forwarded-For entry, which our own proxy appended. */
  trustProxy?: boolean;
  windowMs: number;
}

interface Window {
  count: number;
  resetAt: number;
}

const socketAddress = (c: Context): string | undefined => {
  try {
    return getConnInfo(c).remote.address;
  } catch {
    // Outside a real server (tests) there is no socket to read.
    return undefined;
  }
};

const forwardedAddress = (c: Context): string | undefined => {
  const entries = c.req.header("x-forwarded-for")?.split(",");
  const last = entries?.at(-1)?.trim();
  return last === undefined || last === "" ? undefined : last;
};

/**
 * Fixed-window limit per client address, held in memory. That is exact for one
 * instance; with several instances each allows `max` on its own, which still
 * stops abuse. Put a shared limiter at the proxy if you need an exact total.
 */
export const rateLimit = ({
  getAddress,
  max,
  now = Date.now,
  skip,
  trustProxy = false,
  windowMs,
}: RateLimitOptions): MiddlewareHandler => {
  const windows = new Map<string, Window>();
  let nextSweep = now() + windowMs;
  const readAddress =
    getAddress ?? (trustProxy ? forwardedAddress : socketAddress);

  const sweep = (time: number) => {
    if (time < nextSweep) {
      return;
    }
    for (const [key, window] of windows) {
      if (window.resetAt <= time) {
        windows.delete(key);
      }
    }
    nextSweep = time + windowMs;
  };

  const take = (key: string, time: number): Window => {
    const current = windows.get(key);
    if (current !== undefined && current.resetAt > time) {
      current.count += 1;
      return current;
    }
    if (windows.size >= MAX_TRACKED_CLIENTS) {
      const oldest = windows.keys().next().value;
      if (oldest !== undefined) {
        windows.delete(oldest);
      }
    }
    const fresh = { count: 1, resetAt: time + windowMs };
    windows.set(key, fresh);
    return fresh;
  };

  return async (c, next) => {
    if (skip?.(c) === true) {
      await next();
      return;
    }

    const time = now();
    sweep(time);

    const window = take(readAddress(c) ?? UNKNOWN_CLIENT, time);
    const resetSeconds = Math.max(
      1,
      Math.ceil((window.resetAt - time) / MS_PER_SECOND)
    );

    c.header("RateLimit-Limit", String(max));
    c.header("RateLimit-Remaining", String(Math.max(0, max - window.count)));
    c.header("RateLimit-Reset", String(resetSeconds));

    if (window.count > max) {
      c.header("Retry-After", String(resetSeconds));
      c.res = c.json(
        { message: "Too many requests" },
        HttpStatusCodes.TOO_MANY_REQUESTS
      );
      return;
    }

    await next();
  };
};
