import { createEnv } from "@t3-oss/env-core";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { webOptions } from "../src/web";

describe("web options", () => {
  it("accepts a NEXT_PUBLIC_ variable listed in runtimeEnv", () => {
    const env = createEnv({
      ...webOptions,
      client: { NEXT_PUBLIC_API_URL: z.url() },
      runtimeEnv: { NEXT_PUBLIC_API_URL: "https://api.example.com" },
    });

    expect(env.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
  });

  it("throws, naming the variable, when one is missing", () => {
    expect(() =>
      createEnv({
        ...webOptions,
        client: { NEXT_PUBLIC_API_URL: z.url() },
        // oxlint-disable-next-line sonarjs/no-undefined-assignment -- the test simulates a variable that is genuinely unset, which is undefined at runtime.
        runtimeEnv: { NEXT_PUBLIC_API_URL: undefined },
      })
    ).toThrow(/NEXT_PUBLIC_API_URL/u);
  });

  it("treats an empty string as missing", () => {
    expect(() =>
      createEnv({
        ...webOptions,
        client: { NEXT_PUBLIC_API_URL: z.url() },
        runtimeEnv: { NEXT_PUBLIC_API_URL: "" },
      })
    ).toThrow(/NEXT_PUBLIC_API_URL/u);
  });
});
