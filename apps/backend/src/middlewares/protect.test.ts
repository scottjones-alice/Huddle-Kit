/* oxlint-disable node/callback-return -- Hono middleware ends by awaiting next(); the Node callback rule does not apply. */
import { setTimeout as sleep } from "node:timers/promises";

import { Hono } from "hono";
import { pinoLogger as honoPino } from "hono-pino";
import pino from "pino";
import { afterEach, describe, expect, it } from "vitest";

import { markShuttingDown, resetLifecycle } from "@/lib/lifecycle";
import {
  closeWhenShuttingDown,
  compressResponses,
  limitBody,
  limitDuration,
  logSlowRequests,
  noStore,
  securityHeaders,
} from "@/middlewares/protect";
import type { AppBindings } from "@/types";

const SLOW_MS = 200;
const TIMEOUT_MS = 30;
const SLOW_LOG_MS = 40;

const post = (body: string) => ({
  body,
  headers: { "Content-Type": "text/plain" },
  method: "POST",
});

describe("protect middleware", () => {
  afterEach(() => {
    resetLifecycle();
  });

  it("adds security headers", async () => {
    const app = new Hono().use(securityHeaders()).get("/", (c) => c.text("ok"));

    const response = await app.request("/");

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Cross-Origin-Resource-Policy")).toBe(
      "same-site"
    );
  });

  it("rejects a body over the limit with a JSON 413", async () => {
    const app = new Hono()
      .use(limitBody(10))
      .post("/", async (c) => c.text(await c.req.text()));

    const small = await app.request("/", post("tiny"));
    const large = await app.request("/", post("x".repeat(50)));

    expect(small.status).toBe(200);
    expect(large.status).toBe(413);
    await expect(large.json()).resolves.toStrictEqual({
      message: "Payload too large",
    });
  });

  it("answers a JSON 504 when a request runs too long", async () => {
    const app = new Hono()
      .use(limitDuration(TIMEOUT_MS))
      .get("/", async (c) => {
        await sleep(SLOW_MS);
        return c.text("late");
      });

    const response = await app.request("/");

    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toStrictEqual({
      message: "Request timed out",
    });
  });

  it("asks clients to close the connection only during shutdown", async () => {
    const app = new Hono()
      .use(closeWhenShuttingDown())
      .get("/", (c) => c.text("ok"));

    const before = await app.request("/");
    markShuttingDown();
    const during = await app.request("/");

    expect(before.headers.get("Connection")).toBeNull();
    expect(during.headers.get("Connection")).toBe("close");
  });

  it("marks responses no-store unless the route chose its own caching", async () => {
    const app = new Hono()
      .use(noStore())
      .get("/private", (c) => c.text("ok"))
      .get("/public", (c) => {
        c.header("Cache-Control", "public, max-age=60");
        return c.text("ok");
      });

    const privateResponse = await app.request("/private");
    const publicResponse = await app.request("/public");

    expect(privateResponse.headers.get("Cache-Control")).toBe("no-store");
    expect(publicResponse.headers.get("Cache-Control")).toBe(
      "public, max-age=60"
    );
  });

  it("gzips large responses for clients that accept it", async () => {
    const app = new Hono()
      .use(compressResponses())
      .get("/", (c) => c.text("x".repeat(5000)));

    const response = await app.request("/", {
      headers: { "Accept-Encoding": "gzip" },
    });

    expect(response.headers.get("Content-Encoding")).toBe("gzip");
  });

  it("warns only about requests over the threshold", async () => {
    const lines: string[] = [];
    const logger = pino(
      { level: "warn" },
      {
        write: (line: string) => {
          lines.push(line);
        },
      }
    );
    const app = new Hono<AppBindings>()
      .use(honoPino({ pino: logger }))
      .use(logSlowRequests(SLOW_LOG_MS))
      .get("/fast", (c) => c.text("ok"))
      .get("/slow", async (c) => {
        await sleep(SLOW_LOG_MS * 2);
        return c.text("ok");
      });

    await app.request("/fast");
    await app.request("/slow");

    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("Slow request");
    expect(lines[0]).toContain("/slow");
  });
});
