import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { rateLimit } from "@/middlewares/rate-limit";
import type { RateLimitOptions } from "@/middlewares/rate-limit";

const WINDOW_MS = 60_000;

const build = (options: Partial<RateLimitOptions> = {}) => {
  let time = 0;
  const app = new Hono();
  app.use(
    "*",
    rateLimit({
      getAddress: (c) => c.req.header("x-test-client"),
      max: 2,
      now: () => time,
      windowMs: WINDOW_MS,
      ...options,
    })
  );
  app.get("/", (c) => c.text("ok"));
  const call = async (client = "a", path = "/") =>
    await app.request(path, { headers: { "x-test-client": client } });
  const advance = (ms: number) => {
    time += ms;
  };
  return { advance, call };
};

describe(rateLimit, () => {
  it("allows requests up to the limit and reports what is left", async () => {
    const { call } = build();

    const first = await call();
    const second = await call();

    expect(first.status).toBe(200);
    expect(first.headers.get("RateLimit-Remaining")).toBe("1");
    expect(second.status).toBe(200);
    expect(second.headers.get("RateLimit-Remaining")).toBe("0");
  });

  it("answers 429 with Retry-After once the limit is passed", async () => {
    const { call } = build();
    await call();
    await call();

    const blocked = await call();

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBe("60");
    await expect(blocked.json()).resolves.toStrictEqual({
      message: "Too many requests",
    });
  });

  it("counts each client separately", async () => {
    const { call } = build();
    await call("a");
    await call("a");

    const other = await call("b");

    expect(other.status).toBe(200);
  });

  it("starts a fresh window after the time has passed", async () => {
    const { advance, call } = build();
    await call();
    await call();
    advance(WINDOW_MS);

    const next = await call();

    expect(next.status).toBe(200);
    expect(next.headers.get("RateLimit-Remaining")).toBe("1");
  });

  it("never limits requests the skip rule exempts", async () => {
    const { call } = build({ skip: (c) => c.req.path === "/" });

    const statuses = await Promise.all([call(), call(), call(), call()]);

    expect(statuses.map((response) => response.status)).toStrictEqual([
      200, 200, 200, 200,
    ]);
  });

  it("uses the last X-Forwarded-For entry only when the proxy is trusted", async () => {
    const trusted = new Hono();
    trusted.use(
      "*",
      rateLimit({ max: 1, trustProxy: true, windowMs: WINDOW_MS })
    );
    trusted.get("/", (c) => c.text("ok"));
    const send = async (forwarded: string) =>
      await trusted.request("/", { headers: { "x-forwarded-for": forwarded } });

    await send("1.1.1.1, 9.9.9.9");
    const sameProxyClient = await send("2.2.2.2, 9.9.9.9");
    const otherClient = await send("2.2.2.2, 8.8.8.8");

    // A client cannot dodge the limit by inventing the first entry.
    expect(sameProxyClient.status).toBe(429);
    expect(otherClient.status).toBe(200);
  });
});
