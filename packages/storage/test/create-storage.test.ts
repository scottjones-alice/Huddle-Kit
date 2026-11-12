import type { Database } from "@alice/database";
import { DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createS3Client } from "../src/create-s3-client";
import { createStorage } from "../src/create-storage";
import type { FileRecord } from "../src/create-storage";

type Mock = (...args: never[]) => unknown;

const BUCKET = "huddlekit-test";
const ORG = "11111111-1111-4111-8111-111111111111";

const s3 = createS3Client({
  accessKeyId: "test",
  endpoint: "http://localhost:4566",
  forcePathStyle: true,
  region: "us-east-1",
  secretAccessKey: "test",
});
const s3Mock = mockClient(s3);

const baseFile: FileRecord = {
  bucket: BUCKET,
  checksumSha256: null,
  contentType: "image/png",
  createdAt: new Date(),
  etag: null,
  fileName: "site.png",
  id: "22222222-2222-4222-8222-222222222222",
  key: `orgs/${ORG}/photo/22222222-2222-4222-8222-222222222222/site.png`,
  kind: "photo",
  organizationId: ORG,
  sizeBytes: 100,
  status: "pending",
  updatedAt: new Date(),
  uploadedAt: null,
  uploadedBy: null,
};

const USER = "33333333-3333-4333-8333-333333333333";

/** The few Drizzle calls createStorage makes, backed by spies. */
const createFakeDb = () => {
  const returning = vi.fn<Mock>();
  const values = vi.fn<Mock>(() => ({ returning }));
  const insert = vi.fn<Mock>(() => ({ values }));
  const where = vi.fn<Mock>(() => ({ returning }));
  const set = vi.fn<Mock>(() => ({ where }));
  const update = vi.fn<Mock>(() => ({ set }));
  const deleteWhere = vi.fn<Mock>();
  const del = vi.fn<Mock>(() => ({ where: deleteWhere }));
  const findFirst = vi.fn<Mock>();
  const findMany = vi.fn<Mock>();
  const findViews = vi.fn<Mock>();

  // The fake only implements the Drizzle calls createStorage makes.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const db = {
    delete: del,
    insert,
    query: {
      fileViews: { findMany: findViews },
      files: { findFirst, findMany },
    },
    update,
  } as unknown as Database;

  return {
    db,
    deleteWhere,
    findFirst,
    findMany,
    findViews,
    returning,
    set,
    values,
  };
};

const notFound = () => Object.assign(new Error("nope"), { name: "NotFound" });

describe(createStorage, () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  it("creates a pending row and a presigned PUT url", async () => {
    const fake = createFakeDb();
    fake.returning.mockReturnValue([baseFile]);
    const storage = createStorage({ bucket: BUCKET, db: fake.db, s3 });

    const { file, uploadUrl } = await storage.createUpload({
      contentType: "image/png",
      fileName: "../site.png",
      kind: "photo",
      organizationId: ORG,
      sizeBytes: 100,
      uploadedBy: USER,
    });

    expect(file).toBe(baseFile);
    expect(fake.values).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: BUCKET,
        sizeBytes: 100,
        uploadedBy: USER,
      })
    );

    const url = new URL(uploadUrl);
    expect(url.origin).toBe("http://localhost:4566");
    expect(url.pathname).toContain(`/${BUCKET}/orgs/${ORG}/photo/`);
    expect(url.searchParams.get("X-Amz-Expires")).toBe("900");
  });

  it("honours a custom presign lifetime", async () => {
    const fake = createFakeDb();
    fake.returning.mockReturnValue([baseFile]);
    const storage = createStorage({
      bucket: BUCKET,
      db: fake.db,
      presignTtlSeconds: 60,
      s3,
    });

    const { uploadUrl } = await storage.createUpload({
      contentType: "image/png",
      fileName: "a.png",
      kind: "photo",
      organizationId: ORG,
      sizeBytes: 10,
      uploadedBy: USER,
    });

    expect(new URL(uploadUrl).searchParams.get("X-Amz-Expires")).toBe("60");
  });

  it("rejects invalid uploads before touching the database", async () => {
    const fake = createFakeDb();
    const storage = createStorage({ bucket: BUCKET, db: fake.db, s3 });

    await expect(
      storage.createUpload({
        contentType: "application/pdf",
        fileName: "a.pdf",
        kind: "photo",
        organizationId: ORG,
        sizeBytes: 10,
        uploadedBy: USER,
      })
    ).rejects.toMatchObject({ code: "invalid_content_type" });
    expect(fake.values).not.toHaveBeenCalled();
  });

  it("marks a file uploaded when the object size matches", async () => {
    const fake = createFakeDb();
    fake.findFirst.mockResolvedValue(baseFile);
    fake.returning.mockReturnValue([
      { ...baseFile, etag: '"abc"', status: "uploaded" },
    ]);
    s3Mock
      .on(HeadObjectCommand)
      .resolves({ ContentLength: 100, ETag: '"abc"' });
    const storage = createStorage({ bucket: BUCKET, db: fake.db, s3 });

    const result = await storage.confirmUpload(baseFile.id);

    expect(result.status).toBe("uploaded");
    expect(fake.set).toHaveBeenCalledWith(
      expect.objectContaining({ etag: '"abc"', status: "uploaded" })
    );
  });

  it("does nothing for a file that is already uploaded", async () => {
    const fake = createFakeDb();
    fake.findFirst.mockResolvedValue({ ...baseFile, status: "uploaded" });
    const storage = createStorage({ bucket: BUCKET, db: fake.db, s3 });

    await storage.confirmUpload(baseFile.id);

    expect(s3Mock.commandCalls(HeadObjectCommand)).toHaveLength(0);
  });

  it("reports not_uploaded when the object is missing", async () => {
    const fake = createFakeDb();
    fake.findFirst.mockResolvedValue(baseFile);
    s3Mock.on(HeadObjectCommand).rejects(notFound());
    const storage = createStorage({ bucket: BUCKET, db: fake.db, s3 });

    await expect(storage.confirmUpload(baseFile.id)).rejects.toMatchObject({
      code: "not_uploaded",
    });
    expect(fake.set).not.toHaveBeenCalled();
  });

  it("fails the file and deletes the object on a size mismatch", async () => {
    const fake = createFakeDb();
    fake.findFirst.mockResolvedValue(baseFile);
    s3Mock.on(HeadObjectCommand).resolves({ ContentLength: 999 });
    s3Mock.on(DeleteObjectCommand).resolves({});
    const storage = createStorage({ bucket: BUCKET, db: fake.db, s3 });

    await expect(storage.confirmUpload(baseFile.id)).rejects.toMatchObject({
      code: "size_mismatch",
    });
    expect(fake.set).toHaveBeenCalledWith({ status: "failed" });
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
  });

  it("only hands out download urls for uploaded files", async () => {
    const fake = createFakeDb();
    const storage = createStorage({ bucket: BUCKET, db: fake.db, s3 });

    fake.findFirst.mockResolvedValueOnce(baseFile);
    await expect(
      storage.getDownloadUrl(baseFile.id, USER)
    ).rejects.toMatchObject({ code: "not_ready" });
    expect(fake.values).not.toHaveBeenCalled();

    fake.findFirst.mockResolvedValueOnce({ ...baseFile, status: "uploaded" });
    const url = new URL(await storage.getDownloadUrl(baseFile.id, USER));

    expect(fake.values).toHaveBeenCalledWith({
      fileId: baseFile.id,
      viewedBy: USER,
    });

    expect(url.pathname).toContain(baseFile.key);
    expect(url.searchParams.get("response-content-disposition")).toBe(
      'attachment; filename="site.png"'
    );
  });

  it("lists who viewed a file, newest first", async () => {
    const fake = createFakeDb();
    const view = {
      fileId: baseFile.id,
      id: "v1",
      viewedAt: new Date(),
      viewedBy: USER,
    };
    fake.findFirst.mockResolvedValue(baseFile);
    fake.findViews.mockResolvedValue([view]);
    const storage = createStorage({ bucket: BUCKET, db: fake.db, s3 });

    await expect(storage.listViews(baseFile.id)).resolves.toStrictEqual([view]);
    expect(fake.findViews).toHaveBeenCalledWith({
      orderBy: { viewedAt: "desc" },
      where: { fileId: baseFile.id },
    });
  });

  it("throws not_found for an unknown file", async () => {
    const fake = createFakeDb();
    fake.findFirst.mockResolvedValue(undefined);
    const storage = createStorage({ bucket: BUCKET, db: fake.db, s3 });

    await expect(storage.getDownloadUrl("missing", USER)).rejects.toMatchObject(
      {
        code: "not_found",
      }
    );
  });

  it("lists uploaded files for an organization", async () => {
    const fake = createFakeDb();
    fake.findMany.mockResolvedValue([baseFile]);
    const storage = createStorage({ bucket: BUCKET, db: fake.db, s3 });

    await expect(
      storage.list({ kind: "photo", organizationId: ORG })
    ).resolves.toStrictEqual([baseFile]);
    expect(fake.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      where: {
        bucket: BUCKET,
        kind: "photo",
        organizationId: ORG,
        status: "uploaded",
      },
    });
  });

  it("removes the object before the row", async () => {
    const fake = createFakeDb();
    fake.findFirst.mockResolvedValue(baseFile);
    const order: string[] = [];
    s3Mock.on(DeleteObjectCommand).callsFake(() => {
      order.push("object");
      return {};
    });
    fake.deleteWhere.mockImplementation(() => {
      order.push("row");
    });
    const storage = createStorage({ bucket: BUCKET, db: fake.db, s3 });

    await storage.remove(baseFile.id);

    expect(order).toStrictEqual(["object", "row"]);
  });

  it("keeps the row when deleting the object fails", async () => {
    const fake = createFakeDb();
    fake.findFirst.mockResolvedValue(baseFile);
    s3Mock.on(DeleteObjectCommand).rejects(new Error("boom"));
    const storage = createStorage({ bucket: BUCKET, db: fake.db, s3 });

    await expect(storage.remove(baseFile.id)).rejects.toThrow("boom");
    expect(fake.deleteWhere).not.toHaveBeenCalled();
  });
});

const HEX = "ab".repeat(32);
const HEX_AS_BASE64 = Buffer.from(HEX, "hex").toString("base64");

/** A storage whose file declares a checksum and whose S3 object reports `reported`. */
const storageReporting = (reported: string | undefined) => {
  const fake = createFakeDb();
  fake.findFirst.mockResolvedValue({ ...baseFile, checksumSha256: HEX });
  s3Mock.on(HeadObjectCommand).resolves({
    ChecksumSHA256: reported,
    ContentLength: 100,
  });
  s3Mock.on(DeleteObjectCommand).resolves({});

  return { fake, storage: createStorage({ bucket: BUCKET, db: fake.db, s3 }) };
};

describe("checksums and sensitive files", () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  it("requires a checksum for sensitive files", async () => {
    const fake = createFakeDb();
    const storage = createStorage({ bucket: BUCKET, db: fake.db, s3 });

    await expect(
      storage.createUpload({
        contentType: "application/pdf",
        fileName: "dbs.pdf",
        kind: "sensitive",
        organizationId: ORG,
        sizeBytes: 100,
        uploadedBy: USER,
      })
    ).rejects.toMatchObject({ code: "checksum_required" });
  });

  it("rejects a checksum that is not SHA-256 hex", async () => {
    const fake = createFakeDb();
    const storage = createStorage({ bucket: BUCKET, db: fake.db, s3 });

    await expect(
      storage.createUpload({
        checksumSha256: "not-a-hash",
        contentType: "image/png",
        fileName: "a.png",
        kind: "photo",
        organizationId: ORG,
        sizeBytes: 100,
        uploadedBy: USER,
      })
    ).rejects.toMatchObject({ code: "invalid_checksum" });
  });

  it("stores the checksum and tells the client which headers to send", async () => {
    const fake = createFakeDb();
    fake.returning.mockReturnValue([{ ...baseFile, kind: "sensitive" }]);
    const storage = createStorage({ bucket: BUCKET, db: fake.db, s3 });

    const { uploadHeaders, uploadUrl } = await storage.createUpload({
      checksumSha256: HEX,
      contentType: "application/pdf",
      fileName: "dbs.pdf",
      kind: "sensitive",
      organizationId: ORG,
      sizeBytes: 100,
      uploadedBy: USER,
    });

    expect(fake.values).toHaveBeenCalledWith(
      expect.objectContaining({ checksumSha256: HEX, kind: "sensitive" })
    );
    expect(uploadHeaders).toStrictEqual({
      "Content-Type": "application/pdf",
      "x-amz-checksum-sha256": HEX_AS_BASE64,
      "x-amz-server-side-encryption": "AES256",
    });

    const url = new URL(uploadUrl);
    // Sensitive links expire quickly, and the checksum stays a signed header.
    expect(url.searchParams.get("X-Amz-Expires")).toBe("120");
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toContain(
      "x-amz-checksum-sha256"
    );
  });

  it("confirms when S3 reports the declared checksum", async () => {
    const fake = createFakeDb();
    fake.findFirst.mockResolvedValue({ ...baseFile, checksumSha256: HEX });
    fake.returning.mockReturnValue([
      { ...baseFile, checksumSha256: HEX, status: "uploaded" },
    ]);
    s3Mock.on(HeadObjectCommand).resolves({
      ChecksumSHA256: HEX_AS_BASE64,
      ContentLength: 100,
      ETag: '"abc"',
    });
    const storage = createStorage({ bucket: BUCKET, db: fake.db, s3 });

    const result = await storage.confirmUpload(baseFile.id);

    expect(result.status).toBe("uploaded");
    expect(
      s3Mock.commandCalls(HeadObjectCommand)[0]?.args[0].input
    ).toMatchObject({ ChecksumMode: "ENABLED" });
  });

  it("deletes the object and fails the file when the checksum differs", async () => {
    const { fake, storage } = storageReporting(
      Buffer.alloc(32).toString("base64")
    );

    await expect(storage.confirmUpload(baseFile.id)).rejects.toMatchObject({
      code: "checksum_mismatch",
    });
    expect(fake.set).toHaveBeenCalledWith({ status: "failed" });
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
  });

  it("deletes the object and fails the file when S3 reports no checksum", async () => {
    const { fake, storage } = storageReporting(undefined);

    await expect(storage.confirmUpload(baseFile.id)).rejects.toMatchObject({
      code: "checksum_mismatch",
    });
    expect(fake.set).toHaveBeenCalledWith({ status: "failed" });
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
  });

  it("only returns a file to the organization that owns it", async () => {
    const fake = createFakeDb();
    fake.findFirst.mockResolvedValue(baseFile);
    const storage = createStorage({ bucket: BUCKET, db: fake.db, s3 });

    await expect(storage.getOwnedFile(baseFile.id, ORG)).resolves.toBe(
      baseFile
    );
    await expect(
      storage.getOwnedFile(baseFile.id, "99999999-9999-4999-8999-999999999999")
    ).rejects.toMatchObject({ code: "not_found" });
  });
});
