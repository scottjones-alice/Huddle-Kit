import { afterEach, describe, expect, it, vi } from "vitest";

import { keys } from "../src/keys";

const stubRequired = () => {
  vi.stubEnv("AWS_REGION", "eu-west-2");
  vi.stubEnv("S3_BUCKET", "huddlekit-files");
};

describe(keys, () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads the required values and applies defaults", () => {
    stubRequired();
    vi.stubEnv("S3_FORCE_PATH_STYLE", "");
    vi.stubEnv("S3_PRESIGN_TTL_SECONDS", "");
    vi.stubEnv("S3_ENDPOINT", "");

    expect(keys()).toMatchObject({
      AWS_REGION: "eu-west-2",
      S3_BUCKET: "huddlekit-files",
      S3_FORCE_PATH_STYLE: false,
      S3_PRESIGN_TTL_SECONDS: 900,
    });
    expect(keys().S3_ENDPOINT).toBeUndefined();
  });

  it("parses the emulator settings", () => {
    stubRequired();
    vi.stubEnv("S3_ENDPOINT", "http://localhost:4566");
    vi.stubEnv("S3_FORCE_PATH_STYLE", "true");
    vi.stubEnv("S3_PRESIGN_TTL_SECONDS", "60");

    expect(keys()).toMatchObject({
      S3_ENDPOINT: "http://localhost:4566",
      S3_FORCE_PATH_STYLE: true,
      S3_PRESIGN_TTL_SECONDS: 60,
    });
  });

  it("throws when the bucket is missing", () => {
    stubRequired();
    vi.stubEnv("S3_BUCKET", "");

    expect(() => keys()).toThrow(Error);
  });

  it("throws when the region is missing", () => {
    stubRequired();
    vi.stubEnv("AWS_REGION", "");

    expect(() => keys()).toThrow(Error);
  });

  it("rejects a presign lifetime beyond seven days", () => {
    stubRequired();
    vi.stubEnv("S3_PRESIGN_TTL_SECONDS", "604801");

    expect(() => keys()).toThrow(Error);
  });
});
