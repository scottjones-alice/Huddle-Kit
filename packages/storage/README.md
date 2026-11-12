# @alice/storage

File storage for photos and reports. Bytes live in S3 and are moved with presigned URLs, so large files never pass through the backend. Every file has a row in the `files` table ([`@alice/database`](../database)).

## Usage

```ts
import { createDatabase } from "@alice/database";
import { keys as databaseKeys } from "@alice/database/keys";
import { createS3Client, createStorage } from "@alice/storage";
import { keys } from "@alice/storage/keys";

const env = keys();

const storage = createStorage({
  bucket: env.S3_BUCKET,
  db: createDatabase({ url: databaseKeys().DATABASE_URL }),
  presignTtlSeconds: env.S3_PRESIGN_TTL_SECONDS,
  s3: createS3Client({
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    region: env.AWS_REGION,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  }),
});

// 1. Server: validate, record a pending row, return a URL for the client.
const { file, uploadHeaders, uploadUrl } = await storage.createUpload({
  contentType: "image/png",
  fileName: "site.png",
  kind: "photo", // "photo" | "report" | "sensitive" | "other"
  organizationId,
  sizeBytes: 123_456,
  uploadedBy: userId,
});

// 2. Client: PUT the bytes to uploadUrl with exactly the returned uploadHeaders
//    (Content-Type, plus the checksum and encryption headers when they apply).
// 3. Server: confirm. Checks the object exists with the declared size.
await storage.confirmUpload(file.id);

const files = await storage.list({ organizationId, kind: "photo" });
// Records who asked for access, and when, in file_views.
const downloadUrl = await storage.getDownloadUrl(file.id, userId);
const views = await storage.listViews(file.id); // who viewed, newest first
await storage.remove(file.id); // object first, then the row
```

Problems the caller can fix (wrong type, too big, not uploaded yet, unknown file) throw `StorageError` with a `code`. The package never logs. It does not check who may call it; do that in the route (see `@alice/authorization`).

**Who and when.** Every file records `uploadedBy` (required on `createUpload`), `createdAt` (upload started) and `uploadedAt` (bytes confirmed in the bucket). Each `getDownloadUrl` call writes a `file_views` row with `viewedBy` and `viewedAt`. A presigned url can't be tracked once issued, so this logs access being granted, not every byte read.

Objects are stored at `orgs/<organization>/<kind>/<file id>/<safe name>`.

| Kind        | Allowed types                         | Max size |
| ----------- | ------------------------------------- | -------- |
| `photo`     | JPEG, PNG, WebP, HEIC/HEIF            | 25 MB    |
| `report`    | PDF, CSV, Excel (xls/xlsx), Word docx | 50 MB    |
| `sensitive` | PDF, JPEG, PNG, WebP, HEIC/HEIF       | 25 MB    |
| `other`     | anything                              | 10 MB    |

**Checksums.** Any upload may declare `checksumSha256` (SHA-256 of the bytes as 64 lower-case hex characters). It is stored on the file and signed into the upload URL as the `x-amz-checksum-sha256` header, so S3 refuses bytes that do not match. `confirmUpload` then checks S3's stored checksum again and, if it differs or is missing, deletes the object, marks the file `failed` and throws `checksum_mismatch`.

**Sensitive files** are for scans of personal documents: consent forms, DBS and other certificates, safeguarding attachments. They must declare a checksum (`checksum_required` otherwise, and the database refuses a sensitive row without one), are asked to be encrypted at rest (`x-amz-server-side-encryption: AES256`, returned in `uploadHeaders`), accept only PDF and images, and get upload and download links that expire after 2 minutes. Downloads are logged in `file_views` like every other kind.

**Attaching a file to something.** Consents, safeguarding checks and qualifications point at files with `fileId`. That link is cleared on delete, so the database cannot force the file to be in the same organization. Call `storage.getOwnedFile(fileId, organizationId)` first: a file from another organization throws the same `not_found` as a missing one.

## Routes

No HTTP routes exist yet. Everything needed to add them (endpoints, request bodies, authorization, error-to-status mapping, bucket CORS and IAM, env) is in [server.md](./server.md).

## Database

Each file is a row in `files` (defined in `packages/database/src/schema/files/files.ts`, migration `add_files`): `id`, `organization_id` (cascade delete), `uploaded_by` (set null on user delete), `kind`, `status` (`pending` -> `uploaded` | `failed`), `bucket`, `key` (unique with bucket), `file_name`, `content_type`, `size_bytes`, `checksum_sha256`, `etag`, timestamps. `db.query.files` can load `organization` and `uploader`.

## Structure

- `src/keys.ts` — validated env variables (exported as `@alice/storage/keys`).
- `src/create-s3-client.ts` — S3 client factory (endpoint, path-style, optional keys).
- `src/create-storage.ts` — upload, confirm, download, list and remove.
- `src/object-key.ts` — builds safe object keys and sanitizes file names.
- `src/validation.ts` — per-kind rules (types, size, checksum, link lifetime, encryption).
- `src/errors.ts` — `StorageError` and its codes.
- `test/` — unit tests; `test/integration/` — real Postgres plus Floci.
- `server.md` — guide for adding HTTP routes.

## Environment

Read from the single root `.env` (see `.env.example`): `AWS_REGION`, `S3_BUCKET` (required); `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, `S3_PRESIGN_TTL_SECONDS` (optional).

The bucket needs a CORS rule allowing `PUT` and `GET` from your web origins, or browser uploads will fail.

## Local development

Run [Floci](https://floci.io) (a local AWS emulator) in Docker on port 4566, then set `S3_ENDPOINT=http://localhost:4566`, `S3_FORCE_PATH_STYLE=true`, `AWS_ACCESS_KEY_ID=test` and `AWS_SECRET_ACCESS_KEY=test`, and create the bucket:

```bash
aws --endpoint-url http://localhost:4566 s3 mb s3://huddlekit-dev
```

The S3 client is created with `requestChecksumCalculation: "WHEN_REQUIRED"`. Without it the AWS SDK signs a checksum of an empty body into presigned PUT URLs and S3 rejects real uploads with `BadDigest`. Keep it if you build your own client.

## Scripts

- `pnpm check-types` — type-check
- `pnpm test` — unit tests (mocked S3 and database, no services needed)
- `pnpm test:integration` — real Postgres plus Floci. Needs `TEST_DATABASE_URL`, `TEST_S3_ENDPOINT` and `TEST_S3_BUCKET`. Creates and empties the test bucket.
