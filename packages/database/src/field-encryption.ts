/**
 * Field-level encryption for the most sensitive text, such as safeguarding
 * concern details and note bodies. Encrypt before writing, decrypt after
 * reading, so a database dump or backup alone does not reveal the content.
 *
 * AES-256-GCM with a random 96-bit nonce per value. The `context` (for
 * example `${organizationId}:safeguarding_notes.body`) is bound to the
 * ciphertext as additional authenticated data, so a value copied into another
 * row, column or organization fails to decrypt instead of being read there.
 *
 * Stored format: `v1:<keyId>:<nonce>:<tag>:<ciphertext>` (base64url). The key
 * id lets you rotate: add a new key, make it active, and old values still
 * decrypt with their original key until they are re-encrypted.
 *
 * Keys are 32 bytes. Keep them in a secrets manager or environment variable,
 * never in the database or the repository. Losing a key loses the data.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const NONCE_BYTES = 12;
const VERSION = "v1";
const PART_COUNT = 5;

export interface FieldEncryptorOptions {
  /** The key used for new values. Must be a key in `keys`. */
  activeKeyId: string;
  /** Key id to 32-byte key. Key ids must not contain ":". */
  keys: Record<string, Buffer>;
}

export interface FieldEncryptor {
  decrypt: (payload: string, context: string) => string;
  encrypt: (plaintext: string, context: string) => string;
  /** True if the value was written with a key other than the active one. */
  needsRotation: (payload: string) => boolean;
}

/** Reads a key from base64 text, such as an environment variable. */
export const keyFromBase64 = (value: string): Buffer => {
  const key = Buffer.from(value, "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error(`Encryption key must be ${KEY_BYTES} bytes`);
  }
  return key;
};

const parse = (payload: string) => {
  const parts = payload.split(":");
  const [version, keyId, nonce, tag, ciphertext] = parts;
  if (
    parts.length !== PART_COUNT ||
    version !== VERSION ||
    keyId === undefined ||
    nonce === undefined ||
    tag === undefined ||
    ciphertext === undefined
  ) {
    throw new Error("Not an encrypted field value");
  }
  return { ciphertext, keyId, nonce, tag };
};

export const createFieldEncryptor = ({
  activeKeyId,
  keys,
}: FieldEncryptorOptions): FieldEncryptor => {
  for (const [id, key] of Object.entries(keys)) {
    if (id.includes(":") || key.length !== KEY_BYTES) {
      throw new Error(`Invalid encryption key "${id}"`);
    }
  }
  if (keys[activeKeyId] === undefined) {
    throw new Error(`Active encryption key "${activeKeyId}" is not in keys`);
  }

  return {
    decrypt: (payload, context) => {
      const { ciphertext, keyId, nonce, tag } = parse(payload);
      const key = keys[keyId];
      if (key === undefined) {
        throw new Error(`No encryption key "${keyId}" to decrypt this value`);
      }
      const decipher = createDecipheriv(
        ALGORITHM,
        key,
        Buffer.from(nonce, "base64url")
      );
      decipher.setAAD(Buffer.from(context));
      decipher.setAuthTag(Buffer.from(tag, "base64url"));
      return Buffer.concat([
        decipher.update(Buffer.from(ciphertext, "base64url")),
        decipher.final(),
      ]).toString("utf-8");
    },
    encrypt: (plaintext, context) => {
      const key = keys[activeKeyId];
      if (key === undefined) {
        throw new Error(`Active encryption key "${activeKeyId}" is missing`);
      }
      const nonce = randomBytes(NONCE_BYTES);
      const cipher = createCipheriv(ALGORITHM, key, nonce);
      cipher.setAAD(Buffer.from(context));
      const ciphertext = Buffer.concat([
        cipher.update(plaintext, "utf-8"),
        cipher.final(),
      ]);
      return [
        VERSION,
        activeKeyId,
        nonce.toString("base64url"),
        cipher.getAuthTag().toString("base64url"),
        ciphertext.toString("base64url"),
      ].join(":");
    },
    needsRotation: (payload) => parse(payload).keyId !== activeKeyId,
  };
};
