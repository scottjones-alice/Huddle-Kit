import { S3Client } from "@aws-sdk/client-s3";

export interface CreateS3ClientOptions {
  region: string;
  /** Set for local emulators such as Floci (http://localhost:4566). */
  endpoint?: string;
  forcePathStyle?: boolean;
  /** Leave both out to use the default AWS credential chain. */
  accessKeyId?: string;
  secretAccessKey?: string;
}

const S3_ATTEMPTS = 3;
const S3_CONNECTION_TIMEOUT_MS = 3000;
const S3_REQUEST_TIMEOUT_MS = 15_000;

const isSet = (value: string | undefined): value is string =>
  value !== undefined && value !== "";

export const createS3Client = ({
  region,
  endpoint,
  forcePathStyle = false,
  accessKeyId,
  secretAccessKey,
}: CreateS3ClientOptions): S3Client =>
  new S3Client({
    credentials:
      isSet(accessKeyId) && isSet(secretAccessKey)
        ? { accessKeyId, secretAccessKey }
        : undefined,
    endpoint,
    forcePathStyle,
    // Three tries in all (the SDK default, made explicit) and a limit on each
    // request: without one a stalled connection waits forever.
    maxAttempts: S3_ATTEMPTS,
    region,
    // Without this the SDK puts a CRC32 of an empty body into presigned PUT urls,
    // and S3 rejects the real upload with BadDigest.
    requestChecksumCalculation: "WHEN_REQUIRED",
    requestHandler: {
      connectionTimeout: S3_CONNECTION_TIMEOUT_MS,
      requestTimeout: S3_REQUEST_TIMEOUT_MS,
    },
  });
