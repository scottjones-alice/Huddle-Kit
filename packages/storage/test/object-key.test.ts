import { describe, expect, it } from "vitest";

import { buildObjectKey, sanitizeFileName } from "../src/object-key";

describe(sanitizeFileName, () => {
  it("keeps a plain name", () => {
    expect(sanitizeFileName("site-photo_01.jpg")).toBe("site-photo_01.jpg");
  });

  it("drops directories and traversal", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFileName(String.raw`C:\Users\me\report.pdf`)).toBe(
      "report.pdf"
    );
  });

  it("replaces unsafe characters", () => {
    expect(sanitizeFileName("Q3 report (final).pdf")).toBe(
      "Q3-report-final-.pdf"
    );
  });

  it("falls back when nothing is left", () => {
    expect(sanitizeFileName("...")).toBe("file");
    expect(sanitizeFileName("")).toBe("file");
  });

  it("limits the length", () => {
    expect(
      sanitizeFileName(`${"a".repeat(300)}.png`).length
    ).toBeLessThanOrEqual(100);
  });
});

describe(buildObjectKey, () => {
  it("scopes the key by organization, kind and file id", () => {
    expect(
      buildObjectKey({
        fileId: "f1",
        fileName: "../a b.png",
        kind: "photo",
        organizationId: "o1",
      })
    ).toBe("orgs/o1/photo/f1/a-b.png");
  });
});
