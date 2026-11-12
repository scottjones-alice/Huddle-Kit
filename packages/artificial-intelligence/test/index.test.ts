import { describe, expect, it } from "vitest";

import { name } from "../src/index";

describe("@alice/artificial-intelligence", () => {
  it("exports its package name", () => {
    expect(name).toBe("@alice/artificial-intelligence");
  });
});
