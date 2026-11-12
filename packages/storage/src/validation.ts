import type { FileKind } from "@alice/database";

import { StorageError } from "./errors";

const MEGABYTE = 1024 * 1024;
const SHA256_HEX = /^[0-9a-f]{64}$/u;
const SENSITIVE_PRESIGN_TTL_SECONDS = 120;

interface KindRule {
  /** `null` accepts any content type. */
  contentTypes: readonly string[] | null;
  maxBytes: number;
  /** Uploads must declare a SHA-256 so the stored bytes can be verified. */
  requiresChecksum: boolean;
  /**
   * Upload and download links expire after this many seconds instead of the
   * storage default. `null` uses the default.
   */
  presignTtlSeconds: number | null;
  /** Ask S3 to encrypt the object at rest (SSE-S3). */
  serverSideEncryption: boolean;
}

export const KIND_RULES: Record<FileKind, KindRule> = {
  other: {
    contentTypes: null,
    maxBytes: 10 * MEGABYTE,
    presignTtlSeconds: null,
    requiresChecksum: false,
    serverSideEncryption: false,
  },
  photo: {
    contentTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ],
    maxBytes: 25 * MEGABYTE,
    presignTtlSeconds: null,
    requiresChecksum: false,
    serverSideEncryption: false,
  },
  report: {
    contentTypes: [
      "application/pdf",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxBytes: 50 * MEGABYTE,
    presignTtlSeconds: null,
    requiresChecksum: false,
    serverSideEncryption: false,
  },
  // Scans of consent forms, DBS and other certificates, safeguarding
  // attachments. Only documents and images, a required checksum, encrypted at
  // rest, and links that expire quickly.
  sensitive: {
    contentTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ],
    maxBytes: 25 * MEGABYTE,
    presignTtlSeconds: SENSITIVE_PRESIGN_TTL_SECONDS,
    requiresChecksum: true,
    serverSideEncryption: true,
  },
};

/** Throws a StorageError when the content type or size is not allowed for the kind. */
export const validateUpload = (
  kind: FileKind,
  contentType: string,
  sizeBytes: number
): void => {
  const rule = KIND_RULES[kind];

  if (rule.contentTypes && !rule.contentTypes.includes(contentType)) {
    throw new StorageError(
      "invalid_content_type",
      `${contentType} is not allowed for ${kind} files`
    );
  }

  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
    throw new StorageError(
      "invalid_size",
      "File size must be a positive whole number of bytes"
    );
  }

  if (sizeBytes > rule.maxBytes) {
    throw new StorageError(
      "invalid_size",
      `${kind} files can be at most ${rule.maxBytes} bytes`
    );
  }
};

/**
 * Throws if the kind needs a checksum and none was given, or if one was given
 * that is not 64 lower-case hex characters (SHA-256).
 */
export const validateChecksum = (
  kind: FileKind,
  checksumSha256: string | undefined
): void => {
  if (checksumSha256 === undefined) {
    if (KIND_RULES[kind].requiresChecksum) {
      throw new StorageError(
        "checksum_required",
        `${kind} files must declare a SHA-256 checksum`
      );
    }
    return;
  }

  if (!SHA256_HEX.test(checksumSha256)) {
    throw new StorageError(
      "invalid_checksum",
      "Checksum must be 64 lower-case hex characters (SHA-256)"
    );
  }
};
