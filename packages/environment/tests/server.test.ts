import { createEnv } from "@t3-oss/env-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { serverBase, serverOptions } from "../src/server";

describe("server options", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts a valid variable", () => {
    const env = createEnv({
      ...serverOptions,
      runtimeEnv: { DATABASE_URL: "https://example.com/db" },
      server: { DATABASE_URL: z.url() },
    });

    expect(env.DATABASE_URL).toBe("https://example.com/db");
  });

  it("throws, naming the variable, when one is missing", () => {
    expect(() =>
      createEnv({
        ...serverOptions,
        runtimeEnv: {},
        server: { DATABASE_URL: z.url() },
      })
    ).toThrow(/DATABASE_URL/u);
  });

  it("treats an empty string as missing", () => {
    expect(() =>
      createEnv({
        ...serverOptions,
        runtimeEnv: { DATABASE_URL: "" },
        server: { DATABASE_URL: z.url() },
      })
    ).toThrow(/DATABASE_URL/u);
  });

  it("reads from process.env by default", () => {
    vi.stubEnv("ALICE_TEST_PORT", "4000");

    const env = createEnv({
      ...serverOptions,
      server: { ALICE_TEST_PORT: z.coerce.number() },
    });

    expect(env.ALICE_TEST_PORT).toBe(4000);
  });
});

describe(serverBase, () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads NODE_ENV", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(serverBase().NODE_ENV).toBe("production");
  });

  it("defaults NODE_ENV to development when it is empty", () => {
    vi.stubEnv("NODE_ENV", "");

    expect(serverBase().NODE_ENV).toBe("development");
  });

  it("rejects an unknown NODE_ENV", () => {
    vi.stubEnv("NODE_ENV", "staging");

    expect(() => serverBase()).toThrow(/NODE_ENV/u);
  });
});
