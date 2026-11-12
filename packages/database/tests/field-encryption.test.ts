import { randomBytes } from "node:crypto";

import { describe, expect, it } from "vitest";

import { createFieldEncryptor, keyFromBase64 } from "../src/field-encryption";

const key1 = randomBytes(32);
const key2 = randomBytes(32);
const context = "org-1:safeguarding_notes.body";

describe("field encryption", () => {
  const encryptor = createFieldEncryptor({
    activeKeyId: "k1",
    keys: { k1: key1 },
  });

  it("round-trips text and never stores it readable", () => {
    const stored = encryptor.encrypt("Concern about Sam", context);

    expect(stored.startsWith("v1:k1:")).toBeTruthy();
    expect(stored.includes("Sam")).toBeFalsy();
    expect(encryptor.decrypt(stored, context)).toBe("Concern about Sam");
  });

  it("uses a fresh nonce so equal text encrypts differently", () => {
    expect(encryptor.encrypt("same", context)).not.toBe(
      encryptor.encrypt("same", context)
    );
  });

  it("refuses a value moved to another row, column or organization", () => {
    const stored = encryptor.encrypt("secret", context);

    expect(() =>
      encryptor.decrypt(stored, "org-2:safeguarding_notes.body")
    ).toThrow(Error);
  });

  it("detects tampering and non-encrypted input", () => {
    const stored = encryptor.encrypt("secret", context);

    expect(() => encryptor.decrypt(`${stored}AAAA`, context)).toThrow(Error);
    expect(() => encryptor.decrypt("plain text", context)).toThrow(
      /Not an encrypted/u
    );
  });

  it("rotates keys: old values still decrypt and are flagged", () => {
    const stored = encryptor.encrypt("old", context);
    const rotated = createFieldEncryptor({
      activeKeyId: "k2",
      keys: { k1: key1, k2: key2 },
    });

    expect(rotated.decrypt(stored, context)).toBe("old");
    expect(rotated.needsRotation(stored)).toBeTruthy();
    expect(rotated.needsRotation(rotated.encrypt("new", context))).toBeFalsy();
  });

  it("rejects bad keys and a missing active key", () => {
    expect(() =>
      createFieldEncryptor({ activeKeyId: "k1", keys: { k1: randomBytes(16) } })
    ).toThrow(Error);
    expect(() =>
      createFieldEncryptor({ activeKeyId: "missing", keys: { k1: key1 } })
    ).toThrow(Error);
    expect(() => keyFromBase64("c2hvcnQ=")).toThrow(Error);
    expect(keyFromBase64(key1.toString("base64"))).toStrictEqual(key1);
  });
});
