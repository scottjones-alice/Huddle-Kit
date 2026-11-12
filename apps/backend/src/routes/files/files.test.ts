import { StorageError } from "@alice/storage";
import type { FileRecord, Storage } from "@alice/storage";
import { beforeEach, describe, expect, it, vi } from "vitest";

import createApp from "@/lib/create-app";
import type { GetSession } from "@/middlewares/require-session";

import router from "./files.index";

const USER = "11111111-1111-4111-8111-111111111111";
const ORG = "22222222-2222-4222-8222-222222222222";
const OTHER_ORG = "33333333-3333-4333-8333-333333333333";
const FILE_ID = "44444444-4444-4444-8444-444444444444";

// The services read env and open real connections, so the tests replace them.
const { fake, getSession } = vi.hoisted(() => ({
  fake: {
    confirmUpload: vi.fn<Storage["confirmUpload"]>(),
    createUpload: vi.fn<Storage["createUpload"]>(),
    getDownloadUrl: vi.fn<Storage["getDownloadUrl"]>(),
    getFile: vi.fn<Storage["getFile"]>(),
    getOwnedFile: vi.fn<Storage["getOwnedFile"]>(),
    list: vi.fn<Storage["list"]>(),
    listViews: vi.fn<Storage["listViews"]>(),
    ping: vi.fn<Storage["ping"]>(),
    remove: vi.fn<Storage["remove"]>(),
  },
  getSession: vi.fn<GetSession>(),
}));

vi.mock(import("@/services/storage"), () => ({ storage: fake }));
// Only getSession is used, so a string path avoids typing the whole Better Auth instance.
// oxlint-disable-next-line vitest/prefer-import-in-mock
vi.mock("@/services/auth", () => ({ auth: { api: { getSession } } }));

const now = new Date();

const fileIn = (organizationId: string): FileRecord => ({
  bucket: "b",
  checksumSha256: null,
  contentType: "image/png",
  createdAt: now,
  etag: null,
  fileName: "site.png",
  id: FILE_ID,
  key: "k",
  kind: "photo",
  organizationId,
  sizeBytes: 10,
  status: "uploaded",
  updatedAt: now,
  uploadedAt: now,
  uploadedBy: USER,
});

const session = (activeOrganizationId: string | null = ORG) => ({
  session: { activeOrganizationId },
  user: { id: USER },
});

const app = createApp().route("/", router);

const post = (body: unknown) => ({
  body: JSON.stringify(body),
  headers: { "Content-Type": "application/json" },
  method: "POST",
});

const validUpload = {
  contentType: "image/png",
  fileName: "site.png",
  kind: "photo",
  sizeBytes: 100,
};

const resetMocks = () => {
  vi.resetAllMocks();
  getSession.mockResolvedValue(session());
  fake.getFile.mockResolvedValue(fileIn(ORG));
  // Mirrors storage.getOwnedFile: another organization's file looks like a missing one.
  fake.getOwnedFile.mockImplementation(
    async (id: string, organizationId: string) => {
      const file = await fake.getFile(id);
      if (file.organizationId !== organizationId) {
        throw new StorageError("not_found", `File ${id} does not exist`);
      }
      return file;
    }
  );
  fake.confirmUpload.mockResolvedValue(fileIn(ORG));
  fake.createUpload.mockResolvedValue({
    file: fileIn(ORG),
    uploadHeaders: { "Content-Type": "image/png" },
    uploadUrl: "http://upload.test/x",
  });
  fake.getDownloadUrl.mockResolvedValue("http://download.test/x");
  fake.list.mockResolvedValue([fileIn(ORG)]);
  fake.listViews.mockResolvedValue([]);
  fake.remove.mockResolvedValue(undefined);
};

describe("files routes: who is calling", () => {
  beforeEach(resetMocks);

  it("returns 401 without a session", async () => {
    getSession.mockResolvedValue(null);

    const response = await app.request("/files");

    expect(response.status).toBe(401);
    expect(fake.list).not.toHaveBeenCalled();
  });

  it("returns 403 when the session has no active organization", async () => {
    getSession.mockResolvedValue(session(null));

    const response = await app.request("/files");

    expect(response.status).toBe(403);
    expect(fake.list).not.toHaveBeenCalled();
  });

  it("takes the user and organization from the session, not the body", async () => {
    const response = await app.request(
      "/files",
      post({ ...validUpload, organizationId: OTHER_ORG, uploadedBy: "someone" })
    );

    expect(response.status).toBe(201);
    expect(fake.createUpload).toHaveBeenCalledWith({
      ...validUpload,
      organizationId: ORG,
      uploadedBy: USER,
    });
  });

  it("lists only the session's organization", async () => {
    const response = await app.request("/files?kind=photo");

    expect(response.status).toBe(200);
    expect(fake.list).toHaveBeenCalledWith({
      kind: "photo",
      organizationId: ORG,
    });
  });
});

describe("files routes: another organization's file", () => {
  beforeEach(resetMocks);

  const cases = [
    ["confirm", `/files/${FILE_ID}/confirm`, "POST", "confirmUpload"],
    ["download url", `/files/${FILE_ID}/url`, "GET", "getDownloadUrl"],
    ["views", `/files/${FILE_ID}/views`, "GET", "listViews"],
    ["delete", `/files/${FILE_ID}`, "DELETE", "remove"],
  ] as const;

  it.each(cases)(
    "returns 404 on %s and never touches the file",
    async (_name, path, method, called) => {
      fake.getFile.mockResolvedValue(fileIn(OTHER_ORG));

      const response = await app.request(path, { method });

      expect(response.status).toBe(404);
      expect(fake[called]).not.toHaveBeenCalled();
    }
  );

  it("gives the same 404 body as a file that does not exist", async () => {
    fake.getFile.mockResolvedValueOnce(fileIn(OTHER_ORG));
    const other = await app.request(`/files/${FILE_ID}/url`);

    fake.getFile.mockRejectedValueOnce(
      new StorageError("not_found", `File ${FILE_ID} does not exist`)
    );
    const missing = await app.request(`/files/${FILE_ID}/url`);

    expect(other.status).toBe(404);
    await expect(other.json()).resolves.toStrictEqual(await missing.json());
  });
});

describe("files routes: own organization", () => {
  beforeEach(resetMocks);

  it("records who asked for a download url", async () => {
    const response = await app.request(`/files/${FILE_ID}/url`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toStrictEqual({
      url: "http://download.test/x",
    });
    expect(fake.getDownloadUrl).toHaveBeenCalledWith(FILE_ID, USER);
  });

  it("confirms, lists views and deletes", async () => {
    const confirm = await app.request(`/files/${FILE_ID}/confirm`, {
      method: "POST",
    });
    const views = await app.request(`/files/${FILE_ID}/views`);
    const remove = await app.request(`/files/${FILE_ID}`, { method: "DELETE" });

    expect(confirm.status).toBe(200);
    expect(views.status).toBe(200);
    expect(remove.status).toBe(204);
    expect(fake.remove).toHaveBeenCalledWith(FILE_ID);
  });

  it("rejects a malformed id and an invalid body with 422", async () => {
    const badId = await app.request("/files/not-a-uuid/url");
    const badBody = await app.request(
      "/files",
      post({ ...validUpload, sizeBytes: -5 })
    );

    expect(badId.status).toBe(422);
    expect(badBody.status).toBe(422);
  });
});

describe("files routes: storage errors", () => {
  beforeEach(resetMocks);

  const errors = [
    ["not_ready", 409],
    ["not_uploaded", 409],
    ["invalid_content_type", 422],
    ["invalid_size", 422],
    ["size_mismatch", 422],
  ] as const;

  it.each(errors)("maps %s to %i", async (code, status) => {
    fake.getDownloadUrl.mockRejectedValue(new StorageError(code, "nope"));

    const response = await app.request(`/files/${FILE_ID}/url`);

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toStrictEqual({
      code,
      message: "nope",
    });
  });

  it("keeps unexpected errors as a 500 without leaking details", async () => {
    fake.getDownloadUrl.mockRejectedValue(new Error("db password is hunter2"));

    const response = await app.request(`/files/${FILE_ID}/url`);

    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("hunter2");
  });
});
