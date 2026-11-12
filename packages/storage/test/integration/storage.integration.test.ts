/**
 * Runs against a REAL Postgres and a local S3 emulator (Floci, http://localhost:4566).
 *
 * Needs TEST_DATABASE_URL, TEST_S3_ENDPOINT and TEST_S3_BUCKET (see .env.example).
 * It never reads DATABASE_URL or S3_BUCKET, so it can't touch a real environment.
 * Run with `pnpm --filter @alice/storage test:integration`.
 */

/* oxlint-disable vitest/max-expects -- one end-to-end flow; splitting would repeat the S3 round trip */

import { createHash, randomUUID } from "node:crypto";
import path from "node:path";

import { createDatabase, organizations, users } from "@alice/database";
import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createS3Client } from "../../src/create-s3-client";
import { createStorage } from "../../src/create-storage";

config({
  path: path.join(import.meta.dirname, "../../../../.env"),
  quiet: true,
});

const required = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(
      `${name} is not set. Add it to the root .env (see .env.example) and start Postgres and Floci.`
    );
  }
  return value;
};

const databaseUrl = required("TEST_DATABASE_URL");
const endpoint = required("TEST_S3_ENDPOINT");
const bucket = required("TEST_S3_BUCKET");

const db = createDatabase({ url: databaseUrl });
const s3 = createS3Client({
  accessKeyId: "test",
  endpoint,
  forcePathStyle: true,
  region: "us-east-1",
  secretAccessKey: "test",
});
const storage = createStorage({ bucket, db, s3 });

const runId = randomUUID();
const userId = randomUUID();
const organizationId = randomUUID();
const photoBytes = Buffer.from("not really a png, but bytes are bytes");

const emptyBucket = async () => {
  const listed = await s3.send(new ListObjectsV2Command({ Bucket: bucket }));
  const objects = (listed.Contents ?? []).flatMap(({ Key }) =>
    Key === undefined ? [] : [{ Key }]
  );
  if (objects.length > 0) {
    await s3.send(
      new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects } })
    );
  }
};

describe("storage (real Postgres + S3 emulator)", () => {
  beforeAll(async () => {
    await migrate(db, {
      migrationsFolder: path.join(
        import.meta.dirname,
        "../../../database/migrations"
      ),
      migrationsSchema: "drizzle",
      migrationsTable: "__drizzle_migrations",
    });

    try {
      await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !["BucketAlreadyOwnedByYou", "BucketAlreadyExists"].includes(error.name)
      ) {
        throw error;
      }
    }

    await db
      .insert(users)
      .values({ email: `${runId}@example.com`, id: userId, name: "Uploader" });
    await db.insert(organizations).values({
      createdAt: new Date(),
      id: organizationId,
      name: "Storage Org",
      slug: `storage-${runId}`,
    });
  });

  afterAll(async () => {
    await emptyBucket();
    await db.delete(users).where(eq(users.id, userId));
    await db.delete(organizations).where(eq(organizations.id, organizationId));
    await db.$client.end();
  });

  it("uploads through a presigned url, confirms, lists, downloads and removes", async () => {
    const { file, uploadUrl } = await storage.createUpload({
      contentType: "image/png",
      fileName: "site photo.png",
      kind: "photo",
      organizationId,
      sizeBytes: photoBytes.length,
      uploadedBy: userId,
    });

    expect(file.status).toBe("pending");
    expect(file.key).toContain(`orgs/${organizationId}/photo/${file.id}/`);

    // Nothing is listed until the upload is confirmed.
    await expect(
      storage.list({ kind: "photo", organizationId })
    ).resolves.toHaveLength(0);
    await expect(storage.confirmUpload(file.id)).rejects.toMatchObject({
      code: "not_uploaded",
    });

    const put = await fetch(uploadUrl, {
      body: photoBytes,
      headers: { "Content-Type": "image/png" },
      method: "PUT",
    });
    expect(put.ok).toBeTruthy();

    const confirmed = await storage.confirmUpload(file.id);
    expect(confirmed.status).toBe("uploaded");
    expect(confirmed.etag).toBeTruthy();

    const listed = await storage.list({ kind: "photo", organizationId });
    expect(listed.map((item) => item.id)).toStrictEqual([file.id]);
    await expect(
      storage.list({ kind: "report", organizationId })
    ).resolves.toHaveLength(0);

    const download = await fetch(await storage.getDownloadUrl(file.id, userId));
    expect(download.ok).toBeTruthy();
    expect(Buffer.from(await download.arrayBuffer())).toStrictEqual(photoBytes);

    expect(confirmed.uploadedBy).toBe(userId);
    expect(confirmed.uploadedAt).toBeInstanceOf(Date);
    const views = await storage.listViews(file.id);
    expect(views.map((view) => view.viewedBy)).toStrictEqual([userId]);

    await storage.remove(file.id);

    await expect(
      db.query.files.findFirst({ where: { id: file.id } })
    ).resolves.toBeUndefined();
    await expect(storage.getDownloadUrl(file.id, userId)).rejects.toMatchObject(
      {
        code: "not_found",
      }
    );
  });

  it("uploads a sensitive file with its checksum and headers", async () => {
    const bytes = Buffer.from("%PDF- pretend this is a DBS certificate");
    const checksumSha256 = createHash("sha256").update(bytes).digest("hex");

    const { file, uploadHeaders, uploadUrl } = await storage.createUpload({
      checksumSha256,
      contentType: "application/pdf",
      fileName: "dbs.pdf",
      kind: "sensitive",
      organizationId,
      sizeBytes: bytes.length,
      uploadedBy: userId,
    });

    expect(file.checksumSha256).toBe(checksumSha256);

    const put = await fetch(uploadUrl, {
      body: bytes,
      headers: uploadHeaders,
      method: "PUT",
    });
    expect(put.ok).toBeTruthy();

    const confirmed = await storage.confirmUpload(file.id);
    expect(confirmed.status).toBe("uploaded");
    await expect(
      storage.getOwnedFile(file.id, organizationId)
    ).resolves.toMatchObject({ id: file.id });
    await expect(
      storage.getOwnedFile(file.id, randomUUID())
    ).rejects.toMatchObject({ code: "not_found" });

    await storage.remove(file.id);
  });

  it("does not accept sensitive bytes that differ from the declared checksum", async () => {
    const declared = Buffer.from("what the client said it would send");
    const actual = Buffer.from("something else was sent instead!!!");
    const { file, uploadHeaders, uploadUrl } = await storage.createUpload({
      checksumSha256: createHash("sha256").update(declared).digest("hex"),
      contentType: "application/pdf",
      fileName: "forged.pdf",
      kind: "sensitive",
      organizationId,
      sizeBytes: actual.length,
      uploadedBy: userId,
    });

    const put = await fetch(uploadUrl, {
      body: actual,
      headers: uploadHeaders,
      method: "PUT",
    });

    // S3 checks the bytes against the signed checksum header and refuses the PUT,
    // so nothing is stored and there is nothing to confirm.
    expect(put.status).toBe(400);
    await expect(storage.confirmUpload(file.id)).rejects.toMatchObject({
      code: "not_uploaded",
    });
    await expect(storage.getFile(file.id)).resolves.not.toMatchObject({
      status: "uploaded",
    });
  });

  it("cascades: deleting the organization removes its file rows", async () => {
    const { file } = await storage.createUpload({
      contentType: "application/pdf",
      fileName: "report.pdf",
      kind: "report",
      organizationId,
      sizeBytes: 10,
      uploadedBy: userId,
    });

    await db.delete(organizations).where(eq(organizations.id, organizationId));

    await expect(
      db.query.files.findFirst({ where: { id: file.id } })
    ).resolves.toBeUndefined();
  });
});
