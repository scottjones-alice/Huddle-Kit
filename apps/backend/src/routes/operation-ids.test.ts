import { describe, expect, it } from "vitest";

import { allRouteConfigs } from "./route-configs";

describe("api route operation ids", () => {
  it("finds the routes", () => {
    expect(allRouteConfigs.length).toBeGreaterThanOrEqual(30);
  });

  it("gives every route an operation id", () => {
    const missing = allRouteConfigs
      .filter((route) => (route.operationId ?? "") === "")
      .map((route) => `${route.method} ${route.path}`);

    expect(missing).toStrictEqual([]);
  });

  it("never reuses an operation id", () => {
    const ids = allRouteConfigs.map((route) => route.operationId);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
