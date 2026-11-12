# Server guide: adding file routes

`@alice/storage` has no HTTP layer. This is everything a route in `apps/backend` (Hono) needs to expose it. **Nothing here is built yet**; `apps/backend` is still a hello-world with no auth.

## 1. What the server does

Bytes never go through the backend. The browser or app uploads straight to S3 with a presigned URL; the backend only issues URLs and keeps the `files` table honest.

```
client                      backend (Hono)                 S3 / Floci        Postgres
  | POST /files  ----------->  validate, insert pending  ------------------->  files row
  | <-- { file, uploadUrl } -
  | PUT bytes -------------------------------------------> object stored
  | POST /files/:id/confirm ->  HEAD object, check size  --> HeadObject
  |                             mark uploaded  ------------------------------>  status=uploaded
  | GET  /files/:id/url ----->  presigned GET (15 min) ---->
  | DELETE /files/:id ------->  delete object, then row --->  DeleteObject  ->  row removed
```

## 2. One-time setup (app startup)

Create one `storage` and reuse it. Do this once at startup, not per request.

```ts
import { createDatabase } from "@alice/database";
import { keys as databaseKeys } from "@alice/database/keys";
import { createS3Client, createStorage } from "@alice/storage";
import { keys } from "@alice/storage/keys";

const env = keys();

export const storage = createStorage({
  bucket: env.S3_BUCKET,
  db: createDatabase({
    onPoolError: (error) => console.error(error), // the package never logs
    url: databaseKeys().DATABASE_URL,
  }),
  presignTtlSeconds: env.S3_PRESIGN_TTL_SECONDS,
  s3: createS3Client({
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    region: env.AWS_REGION,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  }),
});
```

`apps/backend/package.json` needs `@alice/storage`, `@alice/database`, `@alice/environment` and `zod` as `workspace:*` / `catalog:` dependencies.

## 3. Routes

All routes are organization-scoped and need a signed-in user. `organizationId` and `userId` come from the **session**, never from the request body.

| Method | Path | Calls | Success |
| --- | --- | --- | --- |
| `POST` | `/files` | `storage.createUpload` | `201 { file, uploadUrl }` |
| `POST` | `/files/:id/confirm` | `storage.confirmUpload` | `200 { file }` |
| `GET` | `/files` | `storage.list` | `200 { files }` |
| `GET` | `/files/:id/url` | `storage.getDownloadUrl(id, session.userId)` | `200 { url }` |
| `GET` | `/files/:id/views` | `storage.listViews` | `200 { views }` |
| `DELETE` | `/files/:id` | `storage.remove` | `204` |

Paths are a suggestion; mount them wherever fits (for example under `/organizations/:orgId/files`).

### `POST /files`

Request body (validate with zod; `FILE_KINDS` is exported from `@alice/database`):

```ts
z.object({
  contentType: z.string().min(1),
  fileName: z.string().min(1).max(255),
  kind: z.enum(FILE_KINDS),
  sizeBytes: z.number().int().positive(),
});
```

Response: `file` is the `pending` row, `uploadUrl` is a presigned `PUT` valid for `S3_PRESIGN_TTL_SECONDS` (default 900 s).

### Client upload (step 2 of the flow)

The client must send **exactly** the declared `Content-Type` and body size, or S3 rejects it with `403`.

```ts
await fetch(uploadUrl, {
  body: file, // File or Blob
  headers: { "Content-Type": file.type },
  method: "PUT",
});
await fetch(`/files/${id}/confirm`, { method: "POST" });
```

A file whose upload is never confirmed stays `pending`; it is not listed and cannot be downloaded.

### `POST /files/:id/confirm`

Safe to call twice (an already-`uploaded` file is returned as is). If the object size differs from what was declared, the object is deleted, the row becomes `failed`, and the call errors with `size_mismatch`.

### `GET /files`

Query: `?kind=photo|report|other` (optional). Returns uploaded files only, newest first.

### `GET /files/:id/url`

Returns a presigned `GET` that forces a download with the original file name. Only `uploaded` files qualify.

### `DELETE /files/:id`

Deletes the S3 object, then the row. If the object delete fails the row is kept, so it can be retried.

## 4. Authorization (the routes must do this)

The storage package does **not** check who is calling. `confirmUpload`, `getDownloadUrl` and `remove` look files up by id only, so a route must first load the file and check it belongs to the caller's organization:

```ts
const file = await db.query.files.findFirst({ where: { id } });
if (file === undefined || file.organizationId !== session.organizationId) {
  return c.json({ error: "not_found" }, 404); // 404, not 403, so ids are not guessable
}
```

Also check the caller is a member of that organization with a role allowed to upload or delete (see `@alice/authorization` and the `members` table). Apply the same check to `list` by passing the session's `organizationId`.

## 5. Error mapping

Methods throw `StorageError` (exported from `@alice/storage`) with a `code`. Map it in a Hono `onError` or per route:

| `code` | Meaning | HTTP |
| --- | --- | --- |
| `invalid_content_type` | Type not allowed for that kind | `422` |
| `invalid_size` | Zero, fractional or over the limit | `422` |
| `not_found` | No such file | `404` |
| `not_uploaded` | Confirm called before the PUT finished | `409` |
| `size_mismatch` | Uploaded bytes differ from declared | `422` |
| `not_ready` | Download asked for a file that is not `uploaded` | `409` |

Anything else (S3 or database outage) is a `500`; log it in the app.

## 6. Limits

| Kind     | Allowed types               | Max size |
| -------- | --------------------------- | -------- |
| `photo`  | JPEG, PNG, WebP, HEIC, HEIF | 25 MB    |
| `report` | PDF, CSV, xls, xlsx, docx   | 50 MB    |
| `other`  | any                         | 10 MB    |

Limits live in `KIND_RULES` in `src/validation.ts`. Change them there; the route and the client should read the same constants rather than repeat numbers.

## 7. Bucket and infrastructure checklist

- **Bucket exists** and is **private** (block all public access). Access is only through presigned URLs.
- **CORS** on the bucket, or browser uploads fail. Minimum:
  ```json
  [
    {
      "AllowedOrigins": ["https://your-web-origin"],
      "AllowedMethods": ["GET", "PUT"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
  ```
- **IAM** for the backend: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `arn:aws:s3:::<bucket>/orgs/*`, plus `s3:GetObject` is what `HeadObject` needs. Prefer an IAM role over access keys; leave `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` blank in AWS.
- **Database** migrated (`pnpm --filter @alice/database db:migrate`) so the `files` table exists.
- **Orphans:** rows stuck in `pending` or `failed` (abandoned uploads) are not cleaned up automatically. A scheduled Trigger.dev task in `apps/worker` that removes rows older than a day is the natural place; not built.

## 8. Environment

Set in the root `.env` (all documented in `.env.example`): `AWS_REGION`, `S3_BUCKET` (required); `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, `S3_PRESIGN_TTL_SECONDS` (optional).

Local with Floci: `S3_ENDPOINT=http://localhost:4566`, `S3_FORCE_PATH_STYLE=true`, `AWS_ACCESS_KEY_ID=test`, `AWS_SECRET_ACCESS_KEY=test`. Presigned URLs then point at `localhost:4566`, which the browser must be able to reach.

## 9. Testing the routes when they exist

- Unit-test the handlers with a fake `storage` (the type is `Storage`, exported from the package), covering the error table above.
- Reuse the storage integration setup (`test/integration/storage.integration.test.ts`): real Postgres plus Floci, using `TEST_DATABASE_URL`, `TEST_S3_ENDPOINT`, `TEST_S3_BUCKET`.
- Cover the authorization cases explicitly: another organization's file id returns `404` on confirm, download and delete.
