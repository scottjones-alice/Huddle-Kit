import { describe, expect, it } from "vitest";

import * as files from "./files/files.route";
import * as onboarding from "./onboarding/onboarding.route";
import * as payments from "./payments/payments.route";
import { rootRoute } from "./root/root.route";

interface RouteConfig {
  method: string;
  operationId?: string;
  path: string;
}

const isRouteConfig = (value: unknown): value is RouteConfig =>
  typeof value === "object" &&
  value !== null &&
  "method" in value &&
  "path" in value;

const collect = (moduleExports: Record<string, unknown>): RouteConfig[] =>
  Object.values(moduleExports).filter((value) => isRouteConfig(value));

const allRoutes: RouteConfig[] = [
  ...collect(files),
  ...collect(onboarding),
  ...collect(payments),
  rootRoute,
];

describe("api route operation ids", () => {
  it("finds the routes", () => {
    expect(allRoutes.length).toBeGreaterThanOrEqual(16);
  });

  it("gives every route an operation id", () => {
    const missing = allRoutes
      .filter((route) => (route.operationId ?? "") === "")
      .map((route) => `${route.method} ${route.path}`);

    expect(missing).toStrictEqual([]);
  });

  it("never reuses an operation id", () => {
    const ids = allRoutes.map((route) => route.operationId);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
