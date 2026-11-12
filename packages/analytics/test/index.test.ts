import { describe, expect, it } from "vitest";

import { name } from "../src/index";

describe("@alice/analytics", () => {
  it("exports its package name", () => {
    expect(name).toBe("@alice/analytics");
  });
});
