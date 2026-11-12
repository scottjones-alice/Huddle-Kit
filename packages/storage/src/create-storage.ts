import { randomUUID } from "node:crypto";

import { fileViews, files } from "@alice/database";
import type { Database, FileKind } from "@alice/database";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import type { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq } from "drizzle-orm";

import { StorageError } from "./errors";
import { buildObjectKey } from "./object-key";
import { KIND_RULES, validateChecksum, validateUpload } from "./validation";

const DEFAULT_PRESIGN_TTL_SECONDS = 900;
const QUOTES = /"/gu;
const CHECKSUM_HEADER = "x-amz-checksum-sha256";
const ENCRYPTION_HEADER = "x-amz-server-side-encryption";

/** S3 reports and expects SHA-256 as base64; we store it as hex. */
const hexToBase64 = (hex: string): string =>
  Buffer.from(hex, "hex").toString("base64");

export interface CreateStorageOptions {
  db: Database;
  s3: S3Client;
  bucket: string;
  presignTtlSeconds?: number;
}

export interface CreateUploadInput {
  organizationId: string;
  /** Who is uploading. Every file is attributed to a user. */
  uploadedBy: string;
  kind: FileKind;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  /**
   * SHA-256 of the bytes, 64 lower-case hex characters. Required for
   * "sensitive" files. When given, S3 rejects an upload whose bytes differ and
   * the file is checked again on confirm.
   */
  checksumSha256?: string;
}

export interface ListFilesInput {
  organizationId: string;
  kind?: FileKind;
}

export type FileRecord = typeof files.$inferSelect;
export type FileViewRecord = typeof fileViews.$inferSelect;

const isNotFound = (error: unknown): boolean =>
  error instanceof Error &&
  (error.name === "NotFound" || error.name === "NoSuchKey");

/**
 * File storage: bytes go to S3 through presigned URLs, and every file has a
 * row in the `files` table. The package never logs; callers decide what to record.
 */
export const createStorage = ({
  db,
  s3,
  bucket,
  presignTtlSeconds = DEFAULT_PRESIGN_TTL_SECONDS,
}: CreateStorageOptions) => {
  const getFile = async (fileId: string): Promise<FileRecord> => {
    const file = await db.query.files.findFirst({
      where: { bucket, id: fileId },
    });

    if (!file) {
      throw new StorageError("not_found", `File ${fileId} does not exist`);
    }

    return file;
  };

  /**
   * Loads a file only if it belongs to the organization. A file in another
   * organization gets the same "not found" as one that does not exist, so ids
   * cannot be probed. Use this before attaching a file to anything (a consent,
   * a safeguarding check, a qualification): those links are cleared on delete,
   * so the database cannot make them same-organization on its own.
   */
  const getOwnedFile = async (
    fileId: string,
    organizationId: string
  ): Promise<FileRecord> => {
    const file = await getFile(fileId);

    if (file.organizationId !== organizationId) {
      throw new StorageError("not_found", `File ${fileId} does not exist`);
    }

    return file;
  };

  /** Records a pending file and returns a presigned URL the client PUTs the bytes to. */
  const createUpload = async (input: CreateUploadInput) => {
    validateUpload(input.kind, input.contentType, input.sizeBytes);
    validateChecksum(input.kind, input.checksumSha256);

    const rule = KIND_RULES[input.kind];
    const checksumBase64 =
      input.checksumSha256 === undefined
        ? undefined
        : hexToBase64(input.checksumSha256);

    const id = randomUUID();
    const key = buildObjectKey({
      fileId: id,
      fileName: input.fileName,
      kind: input.kind,
      organizationId: input.organizationId,
    });

    const [file] = await db
      .insert(files)
      .values({
        bucket,
        checksumSha256: input.checksumSha256,
        contentType: input.contentType,
        fileName: input.fileName,
        id,
        key,
        kind: input.kind,
        organizationId: input.organizationId,
        sizeBytes: input.sizeBytes,
        uploadedBy: input.uploadedBy,
      })
      .returning();

    if (file === undefined) {
      throw new Error("Inserting the file row returned nothing");
    }

    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: bucket,
        ChecksumSHA256: checksumBase64,
        ContentLength: input.sizeBytes,
        ContentType: input.contentType,
        Key: key,
        ServerSideEncryption: rule.serverSideEncryption ? "AES256" : undefined,
      }),
      {
        expiresIn: rule.presignTtlSeconds ?? presignTtlSeconds,
        // Keep these as headers the client must send, not query parameters,
        // so S3 enforces them against the bytes.
        unhoistableHeaders: new Set([CHECKSUM_HEADER, ENCRYPTION_HEADER]),
      }
    );

    // The client must send exactly these headers with the PUT.
    const uploadHeaders: Record<string, string> = {
      "Content-Type": input.contentType,
    };
    if (checksumBase64 !== undefined) {
      uploadHeaders[CHECKSUM_HEADER] = checksumBase64;
    }
    if (rule.serverSideEncryption) {
      uploadHeaders[ENCRYPTION_HEADER] = "AES256";
    }

    return { file, uploadHeaders, uploadUrl };
  };

  /** Checks the object really arrived with the declared size, then marks the file uploaded. */
  const confirmUpload = async (fileId: string): Promise<FileRecord> => {
    const file = await getFile(fileId);

    if (file.status === "uploaded") {
      return file;
    }

    let size: number | undefined;
    let etag: string | undefined;
    let storedChecksum: string | undefined;

    try {
      const head = await s3.send(
        new HeadObjectCommand({
          Bucket: bucket,
          ChecksumMode: "ENABLED",
          Key: file.key,
        })
      );
      size = head.ContentLength;
      etag = head.ETag;
      storedChecksum = head.ChecksumSHA256;
    } catch (error) {
      if (isNotFound(error)) {
        throw new StorageError(
          "not_uploaded",
          `Nothing has been uploaded for file ${fileId} yet`
        );
      }
      throw error;
    }

    if (size !== file.sizeBytes) {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: file.key }));
      await db
        .update(files)
        .set({ status: "failed" })
        .where(eq(files.id, fileId));
      throw new StorageError(
        "size_mismatch",
        `Uploaded size ${size} does not match declared ${file.sizeBytes}`
      );
    }

    // A declared checksum must come back from S3 unchanged. S3 computed it from
    // the bytes it received, so a match means the stored object is what the
    // client hashed; an absent checksum means the upload skipped the header.
    if (
      file.checksumSha256 !== null &&
      storedChecksum !== hexToBase64(file.checksumSha256)
    ) {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: file.key }));
      await db
        .update(files)
        .set({ status: "failed" })
        .where(eq(files.id, fileId));
      throw new StorageError(
        "checksum_mismatch",
        `Uploaded bytes do not match the declared checksum for file ${fileId}`
      );
    }

    const [updated] = await db
      .update(files)
      .set({
        etag: etag ?? null,
        status: "uploaded",
        uploadedAt: new Date(),
      })
      .where(eq(files.id, fileId))
      .returning();

    return updated ?? file;
  };

  /**
   * Presigned GET URL, only for files that finished uploading. Records who asked and
   * when in `file_views` before handing the url out. A presigned url cannot be tracked
   * once issued, so this logs access being granted, not every read.
   */
  const getDownloadUrl = async (
    fileId: string,
    viewedBy: string
  ): Promise<string> => {
    const file = await getFile(fileId);

    if (file.status !== "uploaded") {
      throw new StorageError(
        "not_ready",
        `File ${fileId} is ${file.status}, not uploaded`
      );
    }

    await db.insert(fileViews).values({ fileId, viewedBy });

    return await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: bucket,
        Key: file.key,
        ResponseContentDisposition: `attachment; filename="${file.fileName.replaceAll(QUOTES, "")}"`,
      }),
      {
        expiresIn: KIND_RULES[file.kind].presignTtlSeconds ?? presignTtlSeconds,
      }
    );
  };

  /** Uploaded files for an organization, newest first, optionally of one kind. */
  const list = async ({
    organizationId,
    kind,
  }: ListFilesInput): Promise<FileRecord[]> =>
    await db.query.files.findMany({
      orderBy: { createdAt: "desc" },
      where: { bucket, kind, organizationId, status: "uploaded" },
    });

  /** Who was given access to a file and when, newest first. */
  const listViews = async (fileId: string): Promise<FileViewRecord[]> => {
    await getFile(fileId);

    return await db.query.fileViews.findMany({
      orderBy: { viewedAt: "desc" },
      where: { fileId },
    });
  };

  /** Deletes the object, then the row. Safe to call again if it failed halfway. */
  const remove = async (fileId: string): Promise<void> => {
    const file = await getFile(fileId);

    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: file.key }));
    await db
      .delete(files)
      .where(and(eq(files.id, fileId), eq(files.bucket, bucket)));
  };

  /** Resolves when the bucket is reachable with the current credentials, throws otherwise. */
  const ping = async (): Promise<void> => {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  };

  return {
    confirmUpload,
    createUpload,
    getDownloadUrl,
    getFile,
    getOwnedFile,
    list,
    listViews,
    ping,
    remove,
  };
};

export type Storage = ReturnType<typeof createStorage>;
