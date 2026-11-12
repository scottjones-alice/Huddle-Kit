import { setTimeout as sleep } from "node:timers/promises";

import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createRouter, createTestApp } from "@/lib/create-app";
import type { HealthCheck } from "@/lib/health";

import { createRootHandler } from "./root.handlers";
import { rootRoute } from "./root.route";

const SHORT_TIMEOUT_MS = 50;

const up: HealthCheck["check"] = async () => {
  await Promise.resolve();
};
const down: HealthCheck["check"] = async () => {
  await Promise.reject(new Error("secret connection string leaked"));
};
const HANG_MS = 60_000;
const hang: HealthCheck["check"] = async (signal) => {
  await sleep(HANG_MS, undefined, { signal });
};

const bodySchema = z.object({
  checks: z.record(
    z.string(),
    z.object({ error: z.string().optional(), status: z.string() })
  ),
  status: z.string(),
});

const request = async (checks: HealthCheck[]) => {
  const router = createRouter().openapi(
    rootRoute,
    createRootHandler(checks, SHORT_TIMEOUT_MS)
  );
  const response = await createTestApp(router).request("/");
  return {
    body: bodySchema.parse(await response.json()),
    status: response.status,
  };
};

describe("GET / (health)", () => {
  it("is ok and 200 when every configured check is up", async () => {
    const { body, status } = await request([
      { check: up, critical: true, name: "database" },
      { critical: false, name: "email" },
    ]);

    expect(status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.checks.database.status).toBe("up");
    expect(body.checks.email).toStrictEqual({ status: "not_configured" });
  });

  it("is unhealthy and 503 when a critical check is down", async () => {
    const { body, status } = await request([
      { check: down, critical: true, name: "database" },
      { check: up, critical: true, name: "storage" },
    ]);

    expect(status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body.checks.database.status).toBe("down");
    expect(body.checks.storage.status).toBe("up");
  });

  it("is degraded and 200 when only a non-critical check is down", async () => {
    const { body, status } = await request([
      { check: up, critical: true, name: "database" },
      { check: down, critical: false, name: "novu" },
    ]);

    expect(status).toBe(200);
    expect(body.status).toBe("degraded");
  });

  it("reports a hanging check as a timeout", async () => {
    const { body, status } = await request([
      { check: hang, critical: true, name: "storage" },
    ]);

    expect(status).toBe(503);
    expect(body.checks.storage).toMatchObject({
      error: "timeout",
      status: "down",
    });
  });

  it("never returns the underlying error message", async () => {
    const { body } = await request([
      { check: down, critical: true, name: "database" },
    ]);

    expect(JSON.stringify(body)).not.toContain("secret");
    expect(body.checks.database.error).toBe("unavailable");
  });
});
