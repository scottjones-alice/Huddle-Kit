import { createS3Client, createStorage } from "@alice/storage";
import { keys } from "@alice/storage/keys";

import { db } from "@/services/database";

const {
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
  S3_BUCKET,
  S3_ENDPOINT,
  S3_FORCE_PATH_STYLE,
  S3_PRESIGN_TTL_SECONDS,
} = keys();

const s3 = createS3Client({
  accessKeyId: AWS_ACCESS_KEY_ID,
  endpoint: S3_ENDPOINT,
  forcePathStyle: S3_FORCE_PATH_STYLE,
  region: AWS_REGION,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

export const storage = createStorage({
  bucket: S3_BUCKET,
  db,
  presignTtlSeconds: S3_PRESIGN_TTL_SECONDS,
  s3,
});
