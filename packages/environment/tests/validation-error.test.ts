import { describe, expect, it } from "vitest";

import { throwValidationError } from "../src/validation-error";

describe(throwValidationError, () => {
  it("throws a plain Error", () => {
    expect(() =>
      throwValidationError([{ message: "Required", path: ["PORT"] }])
    ).toThrow(new Error("Invalid environment variables:\n- PORT: Required"));
  });

  it("lists every invalid variable on its own line", () => {
    const issues = [
      { message: "Invalid input", path: ["DATABASE_URL"] },
      { message: "Required", path: [{ key: "PORT" }] },
    ];

    expect(() => throwValidationError(issues)).toThrow(
      /- DATABASE_URL: Invalid input\n- PORT: Required/u
    );
  });
});
