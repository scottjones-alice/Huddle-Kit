import { afterEach, describe, expect, it, vi } from "vitest";

import { keys } from "../src/keys";

describe(keys, () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads the secret key and treats the API URL as optional", () => {
    vi.stubEnv("NOVU_SECRET_KEY", "secret");
    vi.stubEnv("NOVU_API_URL", "");

    expect(keys().NOVU_SECRET_KEY).toBe("secret");
    expect(keys().NOVU_API_URL).toBeUndefined();
  });

  it("accepts a regional or self-hosted API URL", () => {
    vi.stubEnv("NOVU_SECRET_KEY", "secret");
    vi.stubEnv("NOVU_API_URL", "https://eu.api.novu.co");

    expect(keys().NOVU_API_URL).toBe("https://eu.api.novu.co");
  });

  it("throws when the secret key is missing", () => {
    vi.stubEnv("NOVU_SECRET_KEY", "");

    expect(() => keys()).toThrow(/NOVU_SECRET_KEY/u);
  });
});
