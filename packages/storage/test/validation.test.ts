import { describe, expect, it } from "vitest";

import { StorageError } from "../src/errors";
import {
  KIND_RULES,
  validateChecksum,
  validateUpload,
} from "../src/validation";

describe(validateUpload, () => {
  it("accepts a photo and a report", () => {
    expect(() => {
      validateUpload("photo", "image/png", 1000);
    }).not.toThrow();
    expect(() => {
      validateUpload("report", "application/pdf", 1000);
    }).not.toThrow();
  });

  it("accepts any type for other", () => {
    expect(() => {
      validateUpload("other", "text/plain", 10);
    }).not.toThrow();
  });

  it("rejects a content type the kind does not allow", () => {
    expect(() => {
      validateUpload("photo", "application/pdf", 1000);
    }).toThrow(StorageError);
    expect(() => {
      validateUpload("report", "image/png", 1000);
    }).toThrow(expect.objectContaining({ code: "invalid_content_type" }));
  });

  it("rejects empty, fractional and oversized files", () => {
    expect(() => {
      validateUpload("photo", "image/png", 0);
    }).toThrow(expect.objectContaining({ code: "invalid_size" }));
    expect(() => {
      validateUpload("photo", "image/png", 1.5);
    }).toThrow(expect.objectContaining({ code: "invalid_size" }));
    expect(() => {
      validateUpload("photo", "image/png", KIND_RULES.photo.maxBytes + 1);
    }).toThrow(expect.objectContaining({ code: "invalid_size" }));
  });
});

describe("sensitive files", () => {
  it("allow documents and images only, and need a checksum", () => {
    expect(() => {
      validateUpload("sensitive", "application/pdf", 1000);
    }).not.toThrow();
    expect(() => {
      validateUpload("sensitive", "text/csv", 1000);
    }).toThrow(expect.objectContaining({ code: "invalid_content_type" }));
    expect(KIND_RULES.sensitive.requiresChecksum).toBeTruthy();
    expect(KIND_RULES.sensitive.serverSideEncryption).toBeTruthy();
  });

  it("validate the checksum format", () => {
    expect(() => {
      validateChecksum("sensitive", undefined);
    }).toThrow(expect.objectContaining({ code: "checksum_required" }));
    expect(() => {
      validateChecksum("photo", undefined);
    }).not.toThrow();
    expect(() => {
      validateChecksum("photo", "ABC");
    }).toThrow(expect.objectContaining({ code: "invalid_checksum" }));
    expect(() => {
      validateChecksum("sensitive", "a".repeat(64));
    }).not.toThrow();
  });
});
