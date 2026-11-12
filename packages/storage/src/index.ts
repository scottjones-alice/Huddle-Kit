/** Public entry point for @alice/storage. */

export { createS3Client } from "./create-s3-client";

export type { CreateS3ClientOptions } from "./create-s3-client";

export { createStorage } from "./create-storage";

export type {
  CreateStorageOptions,
  CreateUploadInput,
  FileRecord,
  FileViewRecord,
  ListFilesInput,
  Storage,
} from "./create-storage";

export { StorageError } from "./errors";

export type { StorageErrorCode } from "./errors";

export { buildObjectKey, sanitizeFileName } from "./object-key";

export { KIND_RULES, validateChecksum, validateUpload } from "./validation";
