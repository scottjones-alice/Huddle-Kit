import { afterEach, describe, expect, it, vi } from "vitest";

import { keys } from "../src/keys";

const URL = "postgres://user:password@localhost:5432/huddlekit";

describe(keys, () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads DATABASE_URL and parses DATABASE_LOGGER", () => {
    vi.stubEnv("DATABASE_URL", URL);
    vi.stubEnv("DATABASE_LOGGER", "true");

    expect(keys()).toMatchObject({ DATABASE_LOGGER: true, DATABASE_URL: URL });
  });

  it("defaults DATABASE_LOGGER to false", () => {
    vi.stubEnv("DATABASE_URL", URL);
    vi.stubEnv("DATABASE_LOGGER", "");

    expect(keys().DATABASE_LOGGER).toBeFalsy();
  });

  it("throws when DATABASE_URL is missing", () => {
    vi.stubEnv("DATABASE_URL", "");

    expect(() => keys()).toThrow(Error);
  });

  it("defaults the pool size and statement timeout", () => {
    vi.stubEnv("DATABASE_URL", URL);
    vi.stubEnv("DATABASE_POOL_MAX", "");
    vi.stubEnv("DATABASE_STATEMENT_TIMEOUT_MS", "");

    expect(keys()).toMatchObject({
      DATABASE_POOL_MAX: 10,
      DATABASE_STATEMENT_TIMEOUT_MS: 15_000,
    });
  });

  it("rejects a pool size of zero", () => {
    vi.stubEnv("DATABASE_URL", URL);
    vi.stubEnv("DATABASE_POOL_MAX", "0");

    expect(() => keys()).toThrow(/DATABASE_POOL_MAX/u);
  });
});
