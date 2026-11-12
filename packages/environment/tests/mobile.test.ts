import { createEnv } from "@t3-oss/env-core";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { mobileOptions } from "../src/mobile";

describe("mobile options", () => {
  it("accepts an EXPO_PUBLIC_ variable listed in runtimeEnv", () => {
    const env = createEnv({
      ...mobileOptions,
      client: { EXPO_PUBLIC_API_URL: z.url() },
      runtimeEnv: { EXPO_PUBLIC_API_URL: "https://api.example.com" },
    });

    expect(env.EXPO_PUBLIC_API_URL).toBe("https://api.example.com");
  });

  it("throws, naming the variable, when one is missing", () => {
    expect(() =>
      createEnv({
        ...mobileOptions,
        client: { EXPO_PUBLIC_API_URL: z.url() },
        // oxlint-disable-next-line sonarjs/no-undefined-assignment -- the test simulates a variable that is genuinely unset, which is undefined at runtime.
        runtimeEnv: { EXPO_PUBLIC_API_URL: undefined },
      })
    ).toThrow(/EXPO_PUBLIC_API_URL/u);
  });

  it("treats an empty string as missing", () => {
    expect(() =>
      createEnv({
        ...mobileOptions,
        client: { EXPO_PUBLIC_API_URL: z.url() },
        runtimeEnv: { EXPO_PUBLIC_API_URL: "" },
      })
    ).toThrow(/EXPO_PUBLIC_API_URL/u);
  });
});
