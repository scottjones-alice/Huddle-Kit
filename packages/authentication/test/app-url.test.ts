import { describe, expect, it } from "vitest";

import { resolveAppURL } from "../src/app-url";

const TRUSTED = ["https://platform.test", "huddlekit://"];
const FALLBACK = "https://api.test";

const post = (url: string, origin?: string) =>
  new Request(url, {
    headers: origin === undefined ? {} : { origin },
    method: "POST",
  });

describe(resolveAppURL, () => {
  it("follows the callbackURL the client sent", () => {
    const request = post(
      "https://api.test/api/auth/verify-email?callbackURL=huddlekit%3A%2F%2Fapp%2Fhome"
    );

    expect(resolveAppURL(request, TRUSTED, FALLBACK)).toBe("huddlekit://");
  });

  it("accepts deep links under the native scheme", () => {
    const request = post(
      "https://api.test/api/auth/verify-email?callbackURL=huddlekit%3A%2F%2Fhome%2Fwelcome"
    );

    expect(resolveAppURL(request, TRUSTED, FALLBACK)).toBe("huddlekit://");
  });

  it("uses the Origin header when there is no callbackURL", () => {
    const request = post(
      "https://api.test/api/auth/reset-password",
      "https://platform.test"
    );

    expect(resolveAppURL(request, TRUSTED, FALLBACK)).toBe(
      "https://platform.test"
    );
  });

  it("ignores origins that are not trusted", () => {
    const request = post("https://api.test/x", "https://evil.test");

    expect(resolveAppURL(request, TRUSTED, FALLBACK)).toBe(FALLBACK);
    expect(resolveAppURL(undefined, TRUSTED, FALLBACK)).toBe(FALLBACK);
  });
});
