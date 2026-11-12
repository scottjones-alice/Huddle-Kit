export type StorageErrorCode =
  | "checksum_mismatch"
  | "checksum_required"
  | "invalid_checksum"
  | "invalid_content_type"
  | "invalid_size"
  | "not_found"
  | "not_uploaded"
  | "size_mismatch"
  | "not_ready";

/** Thrown for problems the caller can act on (bad input, missing file). */
export class StorageError extends Error {
  readonly code: StorageErrorCode;

  constructor(code: StorageErrorCode, message: string) {
    super(message);
    this.name = "StorageError";
    this.code = code;
  }
}
